import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HoneymoonPackageEntity, HoneymoonBookingEntity } from './entities/honeymoon.entity';
import { CreatePackageDto, BookPackageDto, SearchPackagesDto } from './dto/honeymoon.dto';

type ExternalPackage = {
  id: string;
  source: 'external';
  name: string;
  destination: string;
  description: string;
  durationNights: number;
  couplePrice: number;
  rating: number;
  isFeatured: boolean;
  images: string[];
  vendorId: string;
  isActive: boolean;
  pricePerPerson: number;
  externalBookingUrl?: string;
};

@Injectable()
export class HoneymoonService {
  constructor(
    @InjectRepository(HoneymoonPackageEntity)
    private packageRepository: Repository<HoneymoonPackageEntity>,
    @InjectRepository(HoneymoonBookingEntity)
    private bookingRepository: Repository<HoneymoonBookingEntity>,
  ) {}

  // ─── Packages ───

  async createPackage(vendorId: string, dto: CreatePackageDto): Promise<HoneymoonPackageEntity> {
    const pkg = this.packageRepository.create({ vendorId, ...dto });
    return this.packageRepository.save(pkg);
  }

  async getPackage(id: string): Promise<HoneymoonPackageEntity> {
    const pkg = await this.packageRepository.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  async searchPackages(filters: SearchPackagesDto) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const minPrice = filters.minPrice !== undefined ? Number(filters.minPrice) : undefined;
    const maxPrice = filters.maxPrice !== undefined ? Number(filters.maxPrice) : undefined;
    const minDuration = filters.minDuration !== undefined ? Number(filters.minDuration) : undefined;
    const maxDuration = filters.maxDuration !== undefined ? Number(filters.maxDuration) : undefined;
    const includeExternal = filters.includeExternal !== false;

    const qb = this.packageRepository.createQueryBuilder('p').where('p.isActive = :active', { active: true });

    if (filters.destination) {
      qb.andWhere('p.destination LIKE :dest', { dest: `%${filters.destination}%` });
    }
    if (filters.type) {
      qb.andWhere('p.type = :type', { type: filters.type });
    }
    if (minPrice) {
      qb.andWhere('p.couplePrice >= :minPrice OR p.pricePerPerson >= :minPricePP', {
        minPrice, minPricePP: minPrice / 2,
      });
    }
    if (maxPrice) {
      qb.andWhere('p.couplePrice <= :maxPrice OR p.pricePerPerson <= :maxPricePP', {
        maxPrice, maxPricePP: maxPrice / 2,
      });
    }
    if (minDuration) {
      qb.andWhere('p.durationNights >= :minDur', { minDur: minDuration });
    }
    if (maxDuration) {
      qb.andWhere('p.durationNights <= :maxDur', { maxDur: maxDuration });
    }

    qb.orderBy('p.isFeatured', 'DESC').addOrderBy('p.rating', 'DESC');

    const skip = (page - 1) * limit;
    const [packages, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const externalPackages = includeExternal
      ? await this.fetchExternalPackages({
          ...filters,
          page,
          limit,
          minPrice,
          maxPrice,
          minDuration,
          maxDuration,
        })
      : [];

    const mergedPackages = [...packages, ...externalPackages];

    return {
      packages: mergedPackages,
      total: total + externalPackages.length,
      page,
      totalPages: Math.ceil((total + externalPackages.length) / limit),
      localCount: total,
      externalCount: externalPackages.length,
    };
  }

  private async fetchExternalPackages(filters: SearchPackagesDto): Promise<ExternalPackage[]> {
    const apiKey = process.env.OPENTRIPMAP_API_KEY;
    if (!filters.destination?.trim()) return [];

    const destination = filters.destination.trim();
    const limit = Math.max(1, Math.min(Number(filters.limit) || 20, 20));

    if (!apiKey) {
      return this.fetchFallbackPackages(destination, limit, filters);
    }

    try {
      const geoUrl = new URL('https://api.opentripmap.com/0.1/en/places/geoname');
      geoUrl.searchParams.set('name', destination);
      geoUrl.searchParams.set('apikey', apiKey);

      const geoRes = await fetch(geoUrl.toString());
      if (!geoRes.ok) return [];
      const geo = (await geoRes.json()) as { lat?: number; lon?: number; name?: string; country?: string };
      if (typeof geo.lat !== 'number' || typeof geo.lon !== 'number') return [];

      const radiusUrl = new URL('https://api.opentripmap.com/0.1/en/places/radius');
      radiusUrl.searchParams.set('radius', '50000');
      radiusUrl.searchParams.set('lon', String(geo.lon));
      radiusUrl.searchParams.set('lat', String(geo.lat));
      radiusUrl.searchParams.set('format', 'json');
      radiusUrl.searchParams.set('limit', String(limit));
      radiusUrl.searchParams.set('apikey', apiKey);

      const placesRes = await fetch(radiusUrl.toString());
      if (!placesRes.ok) return [];

      const places = (await placesRes.json()) as Array<{ xid?: string; name?: string; rate?: number }>;
      const nights = Math.max(3, Number(filters.minDuration) || 5);

      return places
        .filter((p) => p.xid && p.name)
        .map((p, index) => {
          const base = 70000 + ((index + 1) * 4500);
          const couplePrice = Math.round(base + nights * 5500);
          const rating = Math.min(5, Math.max(3.5, Number(p.rate || 4)));

          return {
            id: `external_${p.xid}`,
            source: 'external' as const,
            name: `${p.name} Escape`,
            destination: geo.name || destination,
            description: `Curated honeymoon stay around ${p.name} in ${geo.name || destination}.`,
            durationNights: nights,
            couplePrice,
            rating,
            isFeatured: index < 3,
            images: [],
            vendorId: 'external-opentripmap',
            isActive: true,
            pricePerPerson: Math.round(couplePrice / 2),
            externalBookingUrl: `https://opentripmap.com/en/card/${p.xid}`,
          };
        });
    } catch {
      return this.fetchFallbackPackages(destination, limit, filters);
    }
  }

  private async fetchFallbackPackages(
    destination: string,
    limit: number,
    filters: SearchPackagesDto,
  ): Promise<ExternalPackage[]> {
    try {
      const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
      geoUrl.searchParams.set('name', destination);
      geoUrl.searchParams.set('count', String(limit));
      geoUrl.searchParams.set('language', 'en');
      geoUrl.searchParams.set('format', 'json');

      const res = await fetch(geoUrl.toString());
      if (!res.ok) return [];

      const data = (await res.json()) as {
        results?: Array<{ name?: string; country?: string; latitude?: number; longitude?: number }>;
      };

      const nights = Math.max(3, Number(filters.minDuration) || 5);
      const results = data.results || [];

      return results
        .filter((r) => r.name)
        .slice(0, limit)
        .map((r, index) => {
          const base = 65000 + ((index + 1) * 6000);
          const couplePrice = Math.round(base + nights * 5200);
          const rating = Number((4.1 + (index % 4) * 0.2).toFixed(1));
          const place = r.name || destination;
          const country = r.country ? `, ${r.country}` : '';
          const mapQuery = encodeURIComponent(`${place}${country}`);

          return {
            id: `fallback_${place.replace(/\s+/g, '_').toLowerCase()}_${index + 1}`,
            source: 'external' as const,
            name: `${place} Romantic Getaway`,
            destination: `${place}${country}`,
            description: `Curated honeymoon itinerary for ${place}${country} including stays, local experiences and transfers.`,
            durationNights: nights,
            couplePrice,
            rating,
            isFeatured: index < 3,
            images: [],
            vendorId: 'external-open-meteo',
            isActive: true,
            pricePerPerson: Math.round(couplePrice / 2),
            externalBookingUrl: `https://www.openstreetmap.org/search?query=${mapQuery}`,
          };
        });
    } catch {
      return [];
    }
  }

  async getFeaturedPackages(): Promise<HoneymoonPackageEntity[]> {
    return this.packageRepository.find({
      where: { isActive: true, isFeatured: true },
      order: { rating: 'DESC' },
      take: 10,
    });
  }

  async getPopularDestinations() {
    const packages = await this.packageRepository.find({ where: { isActive: true } });
    const destMap: Record<string, { count: number; minPrice: number; image?: string }> = {};

    packages.forEach(p => {
      if (!destMap[p.destination]) {
        destMap[p.destination] = { count: 0, minPrice: p.couplePrice || p.pricePerPerson * 2, image: p.images?.[0] };
      }
      destMap[p.destination].count++;
      const price = p.couplePrice || p.pricePerPerson * 2;
      if (price < destMap[p.destination].minPrice) destMap[p.destination].minPrice = price;
    });

    return Object.entries(destMap)
      .map(([name, data]) => ({ destination: name, ...data }))
      .sort((a, b) => b.count - a.count);
  }

  // ─── Bookings ───

  async bookPackage(userId: string, dto: BookPackageDto): Promise<HoneymoonBookingEntity> {
    const pkg = await this.getPackage(dto.packageId);
    const travellers = dto.travellers || 2;
    const totalAmount = pkg.couplePrice || pkg.pricePerPerson * travellers;

    const booking = this.bookingRepository.create({
      userId,
      packageId: dto.packageId,
      travelDate: dto.travelDate,
      returnDate: dto.returnDate,
      travellers,
      totalAmount,
      specialRequests: dto.specialRequests,
      status: 'requested',
    });

    return this.bookingRepository.save(booking);
  }

  async getUserBookings(userId: string): Promise<HoneymoonBookingEntity[]> {
    return this.bookingRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async getBooking(id: string): Promise<HoneymoonBookingEntity> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateBookingStatus(id: string, status: string): Promise<HoneymoonBookingEntity> {
    const booking = await this.getBooking(id);
    booking.status = status;
    return this.bookingRepository.save(booking);
  }

  async saveItinerary(bookingId: string, itinerary: object): Promise<HoneymoonBookingEntity> {
    const booking = await this.getBooking(bookingId);
    booking.itinerary = JSON.stringify(itinerary);
    return this.bookingRepository.save(booking);
  }
}
