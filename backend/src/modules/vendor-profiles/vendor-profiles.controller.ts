import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { VendorProfilesService } from './vendor-profiles.service';
import { CreateVendorProfileDto, UpdateVendorProfileDto } from './dto/vendor-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  createDocFileFilter,
  createImageFileFilter,
  createUploadStorage,
  createVideoFileFilter,
  toPublicUrl,
} from '../../common/upload/upload.helpers';

type UploadedMulterFile = { filename: string; fieldname: string };

@ApiTags('vendor-profiles')
@Controller('vendor-profiles')
export class VendorProfilesController {
  constructor(private readonly service: VendorProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own vendor profile' })
  getMine(@Req() req: { user: { id: string } }) {
    return this.service.getByUserId(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create vendor profile' })
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateVendorProfileDto) {
    return this.service.create(req.user.id, dto);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own vendor profile' })
  update(@Req() req: { user: { id: string } }, @Body() dto: UpdateVendorProfileDto) {
    return this.service.update(req.user.id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor profile by ID' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post('me/upload/:field')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload vendor profile file' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createUploadStorage('vendor-profiles'),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const field = (req.params as { field?: string }).field;
        let filter = createImageFileFilter();
        if (field === 'governmentId' || field === 'businessRegistration' || field === 'certificate') {
          filter = createDocFileFilter();
        } else if (field === 'portfolioVideo') {
          filter = createVideoFileFilter();
        }
        filter(req, file, cb);
      },
    }),
  )
  async uploadFile(
    @Req() req: { user: { id: string }; params: { field: string } },
    @UploadedFile() file: UploadedMulterFile,
  ) {
    if (!file) throw new BadRequestException('File is required');

    const url = toPublicUrl(`vendor-profiles/${file.filename}`);
    const { field } = req.params;

    const singleFields: Record<string, 'businessLogo' | 'businessBanner' | 'governmentIdUrl' | 'businessRegistrationUrl'> = {
      businessLogo: 'businessLogo',
      businessBanner: 'businessBanner',
      governmentId: 'governmentIdUrl',
      businessRegistration: 'businessRegistrationUrl',
    };

    const arrayFields: Record<string, 'portfolioPhotos' | 'portfolioVideos' | 'awards' | 'certificates'> = {
      portfolioPhoto: 'portfolioPhotos',
      portfolioVideo: 'portfolioVideos',
      award: 'awards',
      certificate: 'certificates',
    };

    if (singleFields[field]) {
      const profile = await this.service.updateFile(req.user.id, singleFields[field], url);
      return { url, profile };
    }

    if (arrayFields[field]) {
      const profile = await this.service.appendArrayField(req.user.id, arrayFields[field], url);
      return { url, profile };
    }

    throw new BadRequestException('Invalid upload field');
  }
}
