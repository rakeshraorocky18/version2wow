import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UsersService } from './users.service.mongodb';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { WizardProfileDto } from './dto/wizard-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  wizardUploadStorage,
  imageFileFilter,
  resumeFileFilter,
  toPublicUrl,
} from './profile-upload.config';
import type { UploadedFile as StoredUploadFile } from './types/uploaded-file.type';

const WIZARD_UPLOAD_INTERCEPTOR = FileFieldsInterceptor(
  [
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'resume', maxCount: 1 },
  ],
  {
    storage: wizardUploadStorage,
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'profilePhoto') {
        return imageFileFilter(req, file, cb);
      }
      if (file.fieldname === 'resume') {
        return resumeFileFilter(req, file, cb);
      }
      cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  },
);

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('wizard-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Save complete wizard profile (multipart)' })
  @UseInterceptors(WIZARD_UPLOAD_INTERCEPTOR)
  async saveWizardProfileRoute(
    @Req() req: { user: { id: string } },
    @Body('profile') profileJson: string,
    @UploadedFiles()
    files?: { profilePhoto?: StoredUploadFile[]; resume?: StoredUploadFile[] },
  ) {
    return this.handleWizardProfileSave(req.user.id, profileJson, files);
  }

  @Post('profile/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Save complete wizard profile with optional file uploads' })
  @UseInterceptors(WIZARD_UPLOAD_INTERCEPTOR)
  async saveWizardProfile(
    @Req() req: { user: { id: string } },
    @Body('profile') profileJson: string,
    @UploadedFiles()
    files?: { profilePhoto?: StoredUploadFile[]; resume?: StoredUploadFile[] },
  ) {
    return this.handleWizardProfileSave(req.user.id, profileJson, files);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user profile' })
  async createProfile(@Req() req: { user: { id: string } }, @Body() createProfileDto: CreateProfileDto) {
    return this.usersService.createProfile(req.user.id, createProfileDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own profile' })
  async getOwnProfile(@Req() req: { user: { id: string } }) {
    return this.usersService.getProfileOrNull(req.user.id);
  }

  @Post('profile/photo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile photo' })
  @UseInterceptors(
    FileInterceptor('profilePhoto', {
      storage: wizardUploadStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadProfilePhoto(
    @Req() req: { user: { id: string } },
    @UploadedFile() file: StoredUploadFile,
  ) {
    if (!file) {
      throw new BadRequestException('Profile photo is required');
    }
    const url = toPublicUrl(`profiles/${file.filename}`);
    const profile = await this.usersService.updateProfilePhoto(req.user.id, url);
    return { url, profile };
  }

  @Post('profile/gallery')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a gallery photo' })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: wizardUploadStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadGalleryPhoto(
    @Req() req: { user: { id: string } },
    @UploadedFile() file: StoredUploadFile,
  ) {
    if (!file) {
      throw new BadRequestException('Photo is required');
    }
    const url = toPublicUrl(`profiles/${file.filename}`);
    const profile = await this.usersService.addGalleryPhoto(req.user.id, url);
    return { url, profile };
  }

  @Delete('profile/photos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a gallery photo' })
  async removeGalleryPhoto(@Req() req: { user: { id: string } }, @Body() body: { url: string }) {
    if (!body?.url) {
      throw new BadRequestException('Photo URL is required');
    }
    const profile = await this.usersService.removeGalleryPhoto(req.user.id, body.url);
    return { profile };
  }

  @Put('profile/gallery-visibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set who can see gallery photos' })
  async setGalleryVisibility(
    @Req() req: { user: { id: string } },
    @Body() body: { visibility: 'public' | 'matched_only' },
  ) {
    if (!body?.visibility || !['public', 'matched_only'].includes(body.visibility)) {
      throw new BadRequestException('visibility must be public or matched_only');
    }
    return this.usersService.setGalleryVisibility(req.user.id, body.visibility);
  }

  @Get('profile/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile by ID' })
  async getProfileById(@Param('id') id: string) {
    return this.usersService.getProfileByIdOrUserId(id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile' })
  async updateProfile(@Req() req: { user: { id: string } }, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search profiles' })
  async searchProfiles(
    @Query('gender') gender?: string,
    @Query('religion') religion?: string,
    @Query('city') city?: string,
    @Query('minAge') minAge?: number,
    @Query('maxAge') maxAge?: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.usersService.searchProfiles(
      { gender, religion, city, minAge, maxAge },
      page,
      limit,
    );
  }

  private async handleWizardProfileSave(
    userId: string,
    profileJson: string,
    files?: { profilePhoto?: StoredUploadFile[]; resume?: StoredUploadFile[] },
  ) {
    if (!profileJson) {
      throw new BadRequestException('Profile data is required');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(profileJson);
    } catch {
      throw new BadRequestException('Invalid profile JSON');
    }

    const dto = plainToInstance(WizardProfileDto, parsed);
    const errors = await validate(dto, { whitelist: true });
    if (errors.length > 0) {
      const messages = errors.flatMap((e) => Object.values(e.constraints || {}));
      throw new BadRequestException(messages.join(', ') || 'Validation failed');
    }

    return this.usersService.saveWizardProfile(userId, dto, {
      profilePhoto: files?.profilePhoto?.[0],
      resume: files?.resume?.[0],
    });
  }
}
