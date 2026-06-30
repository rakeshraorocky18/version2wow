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
import { RepresentativeProfilesService } from './representative-profiles.service';
import {
  CreateRepresentativeProfileDto,
  UpdateRepresentativeProfileDto,
} from './dto/representative-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  createDocFileFilter,
  createImageFileFilter,
  createUploadStorage,
  toPublicUrl,
} from '../../common/upload/upload.helpers';

type UploadedMulterFile = { filename: string; fieldname: string };

@ApiTags('representative-profiles')
@Controller('representative-profiles')
export class RepresentativeProfilesController {
  constructor(private readonly service: RepresentativeProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own representative profile' })
  getMine(@Req() req: { user: { id: string } }) {
    return this.service.getByUserId(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create representative profile' })
  create(@Req() req: { user: { id: string } }, @Body() dto: CreateRepresentativeProfileDto) {
    return this.service.create(req.user.id, dto);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own representative profile' })
  update(@Req() req: { user: { id: string } }, @Body() dto: UpdateRepresentativeProfileDto) {
    return this.service.update(req.user.id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get representative profile by ID' })
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post('me/upload/:field')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload representative profile document or photo' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createUploadStorage('representative-profiles'),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const field = (req.params as { field?: string }).field;
        const filter = field === 'governmentId' || field === 'relationshipProof'
          ? createDocFileFilter()
          : createImageFileFilter();
        filter(req, file, cb);
      },
    }),
  )
  async uploadFile(
    @Req() req: { user: { id: string }; params: { field: string } },
    @UploadedFile() file: UploadedMulterFile,
  ) {
    if (!file) throw new BadRequestException('File is required');

    const fieldMap: Record<string, 'profilePhoto' | 'governmentIdUrl' | 'relationshipProofUrl'> = {
      profilePhoto: 'profilePhoto',
      governmentId: 'governmentIdUrl',
      relationshipProof: 'relationshipProofUrl',
    };

    const mapped = fieldMap[req.params.field];
    if (!mapped) throw new BadRequestException('Invalid upload field');

    const url = toPublicUrl(`representative-profiles/${file.filename}`);
    const profile = await this.service.updateFile(req.user.id, mapped, url);
    return { url, profile };
  }
}
