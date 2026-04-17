export type {
    EmailStatus,
    InboundEmail,
    InboundEmailAttachment,
    InboundEmailAttachmentRow,
    InboundEmailRow,
} from "./model/inbound-email";
export type {
    ReplyTemplatePlaceholderKey,
    ReplyTemplateRow,
} from "./model/reply-template";
export {
    REPLY_TEMPLATE_BRACE_PLACEHOLDERS,
    REPLY_TEMPLATE_PLACEHOLDER_KEYS,
} from "./model/reply-template";
export {
    resendEmailReceivedAttachmentSchema,
    resendEmailReceivedDataSchema,
    resendEmailReceivedEventSchema,
} from "./model/resend-webhook-event";
export type {
    ResendEmailReceivedAttachment,
    ResendEmailReceivedData,
    ResendEmailReceivedEvent,
} from "./model/resend-webhook-event";
