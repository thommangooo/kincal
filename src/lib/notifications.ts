// Notification utilities for editor requests
// Using mailto links as the simplest and most cost-effective approach

export interface ApprovalNotificationData {
  requesterName: string
  requesterEmail: string
  entityName: string
  entityType: 'club' | 'zone' | 'district'
  approvedBy: string
}

export interface RejectionNotificationData {
  requesterName: string
  requesterEmail: string
  entityName: string
  entityType: 'club' | 'zone' | 'district'
  rejectedBy: string
  reason?: string
}

// Generate mailto link for approval notification
export function generateApprovalMailtoLink(data: ApprovalNotificationData): string {
  const subject = `Kin Club Added - ${data.entityName}`
  const body = `Dear ${data.requesterName},

Congratulations! Your request to add ${data.entityName} (${data.entityType}) to the Kin Calendar system has been approved.

You can now sign in to the Kin Calendar system at ${process.env.NEXT_PUBLIC_APP_URL || 'https://kincal.com'} and start managing events and announcements for your ${data.entityType}.

If you have any questions, please don't hesitate to contact us.

Best regards,
${data.approvedBy}
Kin Calendar Administration`

  const encodedSubject = encodeURIComponent(subject)
  const encodedBody = encodeURIComponent(body)
  
  return `mailto:${data.requesterEmail}?subject=${encodedSubject}&body=${encodedBody}`
}

// Generate mailto link for rejection notification
export function generateRejectionMailtoLink(data: RejectionNotificationData): string {
  const subject = `Kin Club Addition Request - ${data.entityName}`
  const body = `Dear ${data.requesterName},

Thank you for your interest in adding ${data.entityName} (${data.entityType}) to the Kin Calendar system.

After careful consideration, we are unable to approve your request at this time.${data.reason ? `\n\nReason: ${data.reason}` : ''}

If you believe this decision was made in error or if you have additional information that might be relevant, please feel free to contact us.

Thank you for your understanding.

Best regards,
${data.rejectedBy}
Kin Calendar Administration`

  const encodedSubject = encodeURIComponent(subject)
  const encodedBody = encodeURIComponent(body)
  
  return `mailto:${data.requesterEmail}?subject=${encodedSubject}&body=${encodedBody}`
}

// Open mailto link in new window/tab
export function openMailtoLink(mailtoLink: string): void {
  // Open in a new window to avoid navigation issues
  window.open(mailtoLink, '_blank')
}

// Generate notification email content for copy/paste (backup method)
export function generateApprovalEmailContent(data: ApprovalNotificationData): string {
  return `To: ${data.requesterEmail}
Subject: Kin Club Added - ${data.entityName}

Dear ${data.requesterName},

Congratulations! Your request to add ${data.entityName} (${data.entityType}) to the Kin Calendar system has been approved.

You can now sign in to the Kin Calendar system at ${process.env.NEXT_PUBLIC_APP_URL || 'https://kincal.com'} and start managing events and announcements for your ${data.entityType}.

If you have any questions, please don't hesitate to contact us.

Best regards,
${data.approvedBy}
Kin Calendar Administration`
}

export function generateRejectionEmailContent(data: RejectionNotificationData): string {
  return `To: ${data.requesterEmail}
Subject: Kin Club Addition Request - ${data.entityName}

Dear ${data.requesterName},

Thank you for your interest in adding ${data.entityName} (${data.entityType}) to the Kin Calendar system.

After careful consideration, we are unable to approve your request at this time.${data.reason ? `\n\nReason: ${data.reason}` : ''}

If you believe this decision was made in error or if you have additional information that might be relevant, please feel free to contact us.

Thank you for your understanding.

Best regards,
${data.rejectedBy}
Kin Calendar Administration`
}

