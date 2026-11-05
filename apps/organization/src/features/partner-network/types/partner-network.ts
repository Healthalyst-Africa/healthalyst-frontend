import type { z } from "zod";
import type {
  directoryEntrySchema,
  partnerInvitationFormSchema,
  partnerInvitationPreviewSchema,
  partnerInvitationSchema,
  partnershipSchema,
} from "~/features/partner-network/schemas/partner-network-schemas";
import type { ServiceCategory } from "~/features/partner-network/config/partner-network";

export type Partnership = z.infer<typeof partnershipSchema>;
export type DirectoryEntry = z.infer<typeof directoryEntrySchema>;
export type PartnerInvitation = z.infer<typeof partnerInvitationSchema>;
export type PartnerInvitationPreview = z.infer<
  typeof partnerInvitationPreviewSchema
>;
export type NewPartnerInvitation = z.output<typeof partnerInvitationFormSchema>;

export type PartnershipRequest = {
  providerOrganizationId: string;
  serviceCategory: ServiceCategory;
  isPreferred: boolean;
  priority: number;
};

export type DirectorySearch = {
  category?: ServiceCategory;
  stateCode?: string;
  searchText?: string;
};

/** Actions on an existing partnership, matching the Platform API's routes. */
export type PartnershipAction =
  | { kind: "accept" }
  | { kind: "decline"; reason?: string }
  | { kind: "suspend"; reason?: string }
  | { kind: "terminate"; reason?: string };

/** The scope cached partner data belongs to. */
export type PartnerScope = { organizationId: string; userId: string };
