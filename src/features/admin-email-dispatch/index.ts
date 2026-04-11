export {
    listEmailSendLogForAdmin,
    type ListEmailSendLogForAdminOptions,
    type ListEmailSendLogForAdminResult,
} from "./api/list-email-send-log-for-admin";
export {sendAdminEmail, type SendAdminEmailResult} from "./api/send-admin-email";
export {
    adminEmailSendSchema,
    type AdminEmailSendInput,
} from "./lib/admin-email-send-schema";
export {applyEmailTemplateString} from "./lib/apply-email-template-string";
export {EMAIL_TEMPLATE_PLACEHOLDER_KEYS} from "@entities/email-template";
export {getAdminEmailLimits} from "./lib/get-admin-email-limits";
