import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeddingPlan, WeddingTask, PlannerActivity } from './entities/planner.entity';
import { PlannerService } from './planner.service';
import { FinanceService } from '../finance/finance.service';
import { EventsService } from '../events/events.service';
import { VendorsServiceTypeorm } from '../vendors/vendors.service.typeorm';
import { UsersService } from '../users/users.service.mongodb';
import { TaskStatus, RsvpStatus, VendorCategory } from '../../common/enums';
import { GuestEntity } from '../events/entities/event.entity';
import { POSTGRES_CONNECTION } from '../../config/database.constants';

const ROMANTIC_QUOTES: Record<string, string> = {
  early: 'Every love story is beautiful, but yours is our favorite. Begin your magical journey.',
  planning: 'Love is not about how many days you have been together — it is about the days that take your breath away.',
  mid: 'The best thing to hold onto in life is each other. You are halfway to forever.',
  final: 'Countdown to forever! Your dream wedding is just around the corner.',
  today: 'Today is the day your forever begins. Cherish every moment.',
};

const INSPIRATION_THEMES = [
  { id: 'royal', title: 'Royal Wedding Theme', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop' },
  { id: 'south-indian', title: 'Traditional South Indian Wedding', image: 'https://images.unsplash.com/photo-1606800052052-a08af8348915?w=600&h=400&fit=crop' },
  { id: 'beach', title: 'Beach Wedding', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&h=400&fit=crop' },
  { id: 'destination', title: 'Destination Wedding', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=400&fit=crop' },
  { id: 'minimal', title: 'Minimal Wedding', image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4a6?w=600&h=400&fit=crop' },
  { id: 'garden', title: 'Garden Wedding', image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&h=400&fit=crop' },
];

const VENDOR_CATEGORIES: { key: string; label: string; category: VendorCategory }[] = [
  { key: 'photographer', label: 'Recommended Photographers', category: VendorCategory.PHOTOGRAPHY },
  { key: 'decorator', label: 'Recommended Decorators', category: VendorCategory.DECOR },
  { key: 'makeup', label: 'Recommended Makeup Artists', category: VendorCategory.MAKEUP },
  { key: 'venue', label: 'Recommended Venues', category: VendorCategory.VENUE },
  { key: 'caterer', label: 'Recommended Caterers', category: VendorCategory.CATERING },
];

@Injectable()
export class PlannerDashboardService {
  constructor(
    private readonly plannerService: PlannerService,
    private readonly financeService: FinanceService,
    private readonly eventsService: EventsService,
    private readonly vendorsService: VendorsServiceTypeorm,
    private readonly usersService: UsersService,
    @InjectRepository(GuestEntity, POSTGRES_CONNECTION)
    private readonly guestRepository: Repository<GuestEntity>,
    @InjectRepository(PlannerActivity, POSTGRES_CONNECTION)
    private readonly activityRepository: Repository<PlannerActivity>,
  ) {}

  private async resolvePlan(userId: string, planId?: string): Promise<WeddingPlan | null> {
    const plans = await this.plannerService.listPlans(userId);
    if (plans.length === 0) return null;
    if (planId) {
      return plans.find((p) => p.id === planId) ?? plans[0];
    }
    return plans[0];
  }

  private daysUntil(weddingDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const wedding = new Date(weddingDate);
    wedding.setHours(0, 0, 0, 0);
    return Math.ceil((wedding.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getQuote(daysRemaining: number, progressPct: number): string {
    if (daysRemaining <= 0) return ROMANTIC_QUOTES.today;
    if (daysRemaining < 60) return ROMANTIC_QUOTES.final;
    if (progressPct >= 50) return ROMANTIC_QUOTES.mid;
    if (daysRemaining > 180) return ROMANTIC_QUOTES.early;
    return ROMANTIC_QUOTES.planning;
  }

  private getSmartTasks(daysRemaining: number) {
    if (daysRemaining > 180) {
      return [
        { title: 'Select Wedding Theme', priority: 'high', dueInDays: 14 },
        { title: 'Estimate Budget', priority: 'high', dueInDays: 7 },
        { title: 'Book Venue', priority: 'high', dueInDays: 30 },
        { title: 'Prepare Guest List', priority: 'medium', dueInDays: 21 },
      ];
    }
    if (daysRemaining < 60) {
      return [
        { title: 'Send Invitations', priority: 'high', dueInDays: 3 },
        { title: 'Finalize Catering', priority: 'high', dueInDays: 7 },
        { title: 'Confirm Decoration', priority: 'medium', dueInDays: 10 },
        { title: 'Arrange Transportation', priority: 'medium', dueInDays: 14 },
      ];
    }
    return [
      { title: 'Shortlist Vendors', priority: 'medium', dueInDays: 14 },
      { title: 'Book Photographer', priority: 'high', dueInDays: 21 },
      { title: 'Plan Menu Tasting', priority: 'medium', dueInDays: 30 },
      { title: 'Order Wedding Attire', priority: 'high', dueInDays: 45 },
    ];
  }

  private buildMilestones(
    tasks: WeddingTask[],
    profileComplete: boolean,
    hasAcceptedMatch: boolean,
  ) {
    const taskDone = (title: string) =>
      tasks.some(
        (t) =>
          !t.parentTaskId &&
          t.title.toLowerCase().includes(title.toLowerCase()) &&
          t.status === TaskStatus.COMPLETED,
      );

    const items = [
      { id: 'profile', label: 'Profile Completed', status: profileComplete ? 'completed' : 'pending' },
      { id: 'engagement', label: 'Engagement Completed', status: hasAcceptedMatch ? 'completed' : 'pending' },
      { id: 'venue', label: 'Venue Booked', status: taskDone('venue') ? 'completed' : 'pending' },
      { id: 'photographer', label: 'Photographer Booked', status: taskDone('photographer') ? 'completed' : 'pending' },
      { id: 'invitations', label: 'Invitations Pending', status: taskDone('invitation') ? 'completed' : 'pending' },
      { id: 'catering', label: 'Catering Pending', status: taskDone('caterer') ? 'completed' : 'pending' },
      { id: 'ceremony', label: 'Wedding Ceremony', status: 'future' },
      { id: 'reception', label: 'Reception', status: 'future' },
    ] as const;

    return items.map((m) => ({
      ...m,
      status: m.status as 'completed' | 'pending' | 'future',
    }));
  }

  private async getCompatibilityScore(userId: string): Promise<number> {
    try {
      // matchmaking data not available in main portal context; fallback to profile-based heuristic
    } catch {
      /* no match data */
    }

    try {
      const profile = await this.usersService.getProfileOrNull(userId);
      if (!profile) return 72;
      let score = 40;
      if (profile.firstName) score += 10;
      if (profile.city) score += 10;
      if (profile.profilePhoto) score += 15;
      if (profile.highestQualification) score += 10;
      const wizard = profile.wizardProfile as Record<string, unknown> | undefined;
      if (wizard?.partnerPreferences) score += 15;
      return Math.min(score, 98);
    } catch {
      return 75;
    }
  }

  private async getGuestStats(userId: string) {
    const events = await this.eventsService.getUserEvents(userId);
    const allGuests: GuestEntity[] = [];
    for (const event of events) {
      const guests = await this.guestRepository.find({ where: { eventId: event.id } });
      allGuests.push(...guests);
    }

    const invited = allGuests.reduce((s, g) => s + (g.partySize || 1), 0);
    const confirmed = allGuests
      .filter((g) => g.rsvpStatus === RsvpStatus.ACCEPTED)
      .reduce((s, g) => s + (g.partySize || 1), 0);
    const declined = allGuests
      .filter((g) => g.rsvpStatus === RsvpStatus.DECLINED)
      .reduce((s, g) => s + (g.partySize || 1), 0);
    const pending = allGuests
      .filter((g) => g.rsvpStatus === RsvpStatus.INVITED)
      .reduce((s, g) => s + (g.partySize || 1), 0);

    return {
      guestCount: allGuests.length,
      totalInvited: invited || allGuests.length,
      confirmedGuests: confirmed,
      declinedGuests: declined,
      pendingGuests: pending,
      acceptedCount: allGuests.filter((g) => g.rsvpStatus === RsvpStatus.ACCEPTED).length,
      declinedCount: allGuests.filter((g) => g.rsvpStatus === RsvpStatus.DECLINED).length,
      pendingCount: allGuests.filter((g) => g.rsvpStatus === RsvpStatus.INVITED).length,
    };
  }

  private async getBudgetData(userId: string, plan: WeddingPlan | null) {
    const defaultCategories = {
      venue: 0,
      photography: 0,
      decoration: 0,
      catering: 0,
      miscellaneous: 0,
    };

    try {
      const summary = await this.financeService.getBudgetSummary(userId);
      const byCat = summary.byCategory || {};
      const mapCategory = (keys: string[]) => {
        let total = 0;
        for (const [cat, vals] of Object.entries(byCat)) {
          if (keys.some((k) => cat.toLowerCase().includes(k))) {
            total += (vals as { estimated: number }).estimated || 0;
          }
        }
        return total;
      };

      const totalBudget = summary.summary.totalBudget || plan?.totalBudget || 0;
      const spentAmount = summary.summary.totalPaid || summary.summary.totalActual || plan?.spentAmount || 0;

      return {
        totalBudget,
        spentAmount,
        remainingAmount: Math.max(0, totalBudget - spentAmount),
        budgetPercentage: totalBudget > 0 ? Math.round((spentAmount / totalBudget) * 100) : 0,
        overBudget: summary.summary.overBudget || false,
        categories: {
          venueBudget: mapCategory(['venue']) || Math.round(totalBudget * 0.35),
          photoBudget: mapCategory(['photo']) || Math.round(totalBudget * 0.15),
          decorationBudget: mapCategory(['decor']) || Math.round(totalBudget * 0.12),
          cateringBudget: mapCategory(['cater', 'food']) || Math.round(totalBudget * 0.25),
          miscBudget: mapCategory(['misc', 'other', 'transport']) || Math.round(totalBudget * 0.13),
        },
        utilization: Object.fromEntries(
          Object.entries(byCat).map(([cat, vals]) => {
            const v = vals as { estimated: number; paid: number };
            const pct = v.estimated > 0 ? Math.round((v.paid / v.estimated) * 100) : 0;
            return [cat, { allocated: v.estimated, spent: v.paid, percentage: pct, overspent: v.paid > v.estimated }];
          }),
        ),
      };
    } catch {
      const totalBudget = plan?.totalBudget || 0;
      const spentAmount = plan?.spentAmount || 0;
      return {
        totalBudget,
        spentAmount,
        remainingAmount: Math.max(0, totalBudget - spentAmount),
        budgetPercentage: totalBudget > 0 ? Math.round((spentAmount / totalBudget) * 100) : 0,
        overBudget: false,
        categories: {
          venueBudget: Math.round(totalBudget * 0.35) || defaultCategories.venue,
          photoBudget: Math.round(totalBudget * 0.15) || defaultCategories.photography,
          decorationBudget: Math.round(totalBudget * 0.12) || defaultCategories.decoration,
          cateringBudget: Math.round(totalBudget * 0.25) || defaultCategories.catering,
          miscBudget: Math.round(totalBudget * 0.13) || defaultCategories.miscellaneous,
        },
        utilization: {},
      };
    }
  }

  private async getVendorRecommendations(userId: string, plan: WeddingPlan | null) {
    const profile = await this.usersService.getProfileOrNull(userId);
    const city = typeof profile?.city === 'string' ? profile.city : undefined;
    const maxPrice = plan?.totalBudget ? Math.round(plan.totalBudget * 0.2) : undefined;

    const results: Record<string, unknown[]> = {};

    for (const vc of VENDOR_CATEGORIES) {
      try {
        const search = await this.vendorsService.searchVendors({
          category: vc.category,
          city,
          maxPrice,
          includeExternal: true,
        });
        const vendors = (search.vendors || []).slice(0, 3).map((v) => ({
          id: v._id || v.id,
          name: v.businessName,
          category: vc.label,
          rating: v.rating?.average ?? 4.5,
          reviewCount: v.rating?.count ?? 0,
          priceRange: v.pricing?.startingPrice
            ? `₹${v.pricing.startingPrice.toLocaleString('en-IN')}+`
            : 'Contact for pricing',
          availability: 'Available',
          image: `https://images.unsplash.com/photo-${1519225421980 + Math.floor(Math.random() * 1000)}-715cb0215aed?w=400&h=280&fit=crop`,
          location: [v.location?.city, v.location?.state].filter(Boolean).join(', '),
        }));
        results[vc.key] = vendors;
      } catch {
        results[vc.key] = [];
      }
    }

    return results;
  }

  private buildNotifications(
    daysRemaining: number,
    guestStats: Awaited<ReturnType<typeof this.getGuestStats>>,
    budget: Awaited<ReturnType<typeof this.getBudgetData>>,
    tasks: WeddingTask[],
  ) {
    const notifications = [];

    const pendingPhoto = tasks.find(
      (t) => t.title.toLowerCase().includes('photographer') && t.status !== TaskStatus.COMPLETED,
    );
    if (pendingPhoto) {
      notifications.push({
        id: 'photo-pending',
        message: 'Your photographer booking is pending.',
        priority: 'high',
        action: 'View Tasks',
        actionPath: '/app/planner',
      });
    }

    if (daysRemaining > 0 && daysRemaining <= 90) {
      notifications.push({
        id: 'countdown',
        message: `Only ${daysRemaining} days left until your big day.`,
        priority: daysRemaining <= 30 ? 'high' : 'medium',
        action: 'View Countdown',
        actionPath: '/app/planner',
      });
    }

    if (guestStats.confirmedGuests > 0) {
      notifications.push({
        id: 'rsvp-confirmed',
        message: `${guestStats.confirmedGuests} guests have confirmed attendance.`,
        priority: 'low',
        action: 'View RSVP',
        actionPath: '/app/events',
      });
    }

    if (budget.budgetPercentage >= 70) {
      notifications.push({
        id: 'budget-alert',
        message: `Budget utilization reached ${budget.budgetPercentage}%.`,
        priority: budget.overBudget ? 'high' : 'medium',
        action: 'Review Budget',
        actionPath: '/app/finance',
      });
    }

    notifications.push({
      id: 'decorator-quote',
      message: 'Your decorator has sent a quotation.',
      priority: 'medium',
      action: 'View Quote',
      actionPath: '/app/vendors',
    });

    return notifications;
  }

  private formatActivity(activities: PlannerActivity[]) {
    const iconMap: Record<string, string> = {
      completed: 'task_completed',
      added: 'task_added',
      updated: 'task_updated',
    };

    return activities.map((a) => {
      let type = 'task_completed';
      let text = a.taskTitle;

      if (a.action === 'completed') {
        type = 'task_completed';
        text = `Task Completed: ${a.taskTitle}`;
      } else if (a.details?.toLowerCase().includes('budget')) {
        type = 'budget_updated';
        text = 'Budget Updated';
      } else if (a.details?.toLowerCase().includes('rsvp')) {
        type = 'rsvp_received';
        text = 'Guest RSVP Received';
      } else if (a.details?.toLowerCase().includes('invitation')) {
        type = 'invitation_sent';
        text = 'Invitation Sent';
      } else if (a.details?.toLowerCase().includes('payment')) {
        type = 'payment_completed';
        text = 'Payment Completed';
      } else if (a.details?.toLowerCase().includes('vendor') || a.details?.toLowerCase().includes('book')) {
        type = 'vendor_booked';
        text = `Vendor Booked: ${a.taskTitle}`;
      }

      return {
        id: a.id,
        type,
        text,
        timestamp: a.createdAt,
        icon: iconMap[a.action] || 'activity',
      };
    });
  }

  async getDashboard(userId: string, planId?: string) {
    const plan = await this.resolvePlan(userId, planId);
    const profile = await this.usersService.getProfileOrNull(userId);
    const userName =
      (profile?.firstName as string | undefined) ||
      (typeof profile?.displayName === 'string' ? profile.displayName.split(' ')[0] : undefined) ||
      'Beautiful Soul';

    if (!plan) {
      return {
        hasPlan: false,
        userName,
        inspiration: INSPIRATION_THEMES,
      };
    }

    const timeline = await this.plannerService.getTimeline(userId, plan.id);
    const guestStats = await this.getGuestStats(userId);
    const budget = await this.getBudgetData(userId, plan);
    const compatibility = await this.getCompatibilityScore(userId);
    const daysRemaining = this.daysUntil(plan.weddingDate);

    let hasAcceptedMatch = false;
    // TODO: Implement accepted match check if needed
    // const accepted = await this.matchmakingService.getAcceptedMatches(userId);
    // hasAcceptedMatch = accepted.length > 0;

    const events = await this.eventsService.getUserEvents(userId);
    const now = new Date();
    const upcomingEventsCount = events.filter((e) => new Date(e.dateTime) >= now).length;

    const parentTasks = timeline.tasks.filter((t) => !t.parentTaskId);

    return {
      hasPlan: true,
      userName,
      partnerName: plan.partnerName,
      weddingDate: plan.weddingDate,
      venue: plan.venue || 'To be decided',
      theme: plan.theme || 'Romantic Elegance',
      daysRemaining,
      compatibilityPercentage: compatibility,
      progress: timeline.progress,
      budget,
      guests: guestStats,
      upcomingEventsCount,
      quote: this.getQuote(daysRemaining, timeline.progress.percentage),
      milestones: this.buildMilestones(parentTasks, Boolean(profile?.firstName), hasAcceptedMatch),
      smartTasks: this.getSmartTasks(daysRemaining).map((t) => ({
        ...t,
        dueDate: new Date(Date.now() + t.dueInDays * 86400000).toISOString().split('T')[0],
      })),
      planId: plan.id,
    };
  }

  async getTasks(userId: string, planId?: string) {
    const plan = await this.resolvePlan(userId, planId);
    if (!plan) return { tasks: [], smartTasks: [] };
    const timeline = await this.plannerService.getTimeline(userId, plan.id);
    const daysRemaining = this.daysUntil(plan.weddingDate);
    const parentTasks = timeline.tasks
      .filter((t) => !t.parentTaskId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priorityLevel || 'medium',
        dueDate: t.dueDate,
        status: t.status,
        category: t.category,
      }));

    return {
      tasks: parentTasks,
      smartTasks: this.getSmartTasks(daysRemaining).map((t) => ({
        ...t,
        dueDate: new Date(Date.now() + t.dueInDays * 86400000).toISOString().split('T')[0],
      })),
    };
  }

  async getBudget(userId: string, planId?: string) {
    const plan = await this.resolvePlan(userId, planId);
    return this.getBudgetData(userId, plan);
  }

  async getCountdown(userId: string, planId?: string) {
    const plan = await this.resolvePlan(userId, planId);
    if (!plan) return { daysRemaining: 0, weddingDate: null, hours: 0, minutes: 0, seconds: 0 };

    const daysRemaining = this.daysUntil(plan.weddingDate);
    const wedding = new Date(plan.weddingDate);
    wedding.setHours(18, 0, 0, 0);
    const diff = Math.max(0, wedding.getTime() - Date.now());

    return {
      daysRemaining,
      weddingDate: plan.weddingDate,
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }

  async getVendors(userId: string, planId?: string) {
    const plan = await this.resolvePlan(userId, planId);
    return this.getVendorRecommendations(userId, plan);
  }

  async getGuests(userId: string) {
    return this.getGuestStats(userId);
  }

  async getRsvp(userId: string) {
    const stats = await this.getGuestStats(userId);
    const total = stats.totalInvited || 1;
    return {
      ...stats,
      acceptedPercentage: Math.round((stats.confirmedGuests / total) * 100),
      declinedPercentage: Math.round((stats.declinedGuests / total) * 100),
      pendingPercentage: Math.round((stats.pendingGuests / total) * 100),
    };
  }

  async getNotifications(userId: string, planId?: string) {
    const plan = await this.resolvePlan(userId, planId);
    if (!plan) return [];
    const timeline = await this.plannerService.getTimeline(userId, plan.id);
    const guestStats = await this.getGuestStats(userId);
    const budget = await this.getBudgetData(userId, plan);
    const daysRemaining = this.daysUntil(plan.weddingDate);
    return this.buildNotifications(daysRemaining, guestStats, budget, timeline.tasks);
  }

  async getActivity(userId: string, planId?: string) {
    const plan = await this.resolvePlan(userId, planId);
    if (!plan) return [];
    const activities = await this.activityRepository.find({
      where: { planId: plan.id },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return this.formatActivity(activities);
  }

  getInspiration() {
    return INSPIRATION_THEMES;
  }
}
