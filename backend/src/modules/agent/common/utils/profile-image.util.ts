import { AgentDocumentEntity } from '../entities/agent-document.entity';
import { AgentDocumentType } from '../enums/agent.enums';

/**
 * Resolve the primary profile image URL for a customer.
 * Prefers dedicated profile_photo docs; falls back to oldest customer_photo
 * for customers onboarded before profile_photo existed.
 */
export function resolveProfileImageUrl(
  documents: Pick<AgentDocumentEntity, 'type' | 'fileUrl' | 'createdAt'>[],
): string | null {
  if (!documents?.length) return null;

  const profilePhotos = documents
    .filter((d) => d.type === AgentDocumentType.PROFILE_PHOTO)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  if (profilePhotos[0]?.fileUrl) return profilePhotos[0].fileUrl;

  const galleryPhotos = documents
    .filter((d) => d.type === AgentDocumentType.CUSTOMER_PHOTO)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  return galleryPhotos[0]?.fileUrl ?? null;
}
