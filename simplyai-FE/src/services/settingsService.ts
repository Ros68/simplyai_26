/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL } from "@/config/api";

export const fetchAppSettings = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings`);

    if (!response.ok) {
      throw new Error("Failed to fetch settings");
    }
    const result = await response.json();
    console.log("Fetched app settings:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching app settings:", error);
    return null;
  }
};

export const fetchColorProfiles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/colorProfiles`);
    if (!response.ok) {
      throw new Error("Failed to fetch color profiles");
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching color profiles:", error);
    return null;
  }
};

export const saveAppSettings = async (settings: any) => {
  try {
    const body = {
      site_name: settings.siteName,
      site_description: settings.siteDescription,
      contact_email: settings.contactEmail,
      site_url: settings.siteUrl,
      logo: settings.logo,
      favicon: settings.favicon,
      // Colors - 5 color system
      primary_color: settings.primaryColor,
      secondary_color: settings.secondaryColor,
      accent_color: settings.accentColor,
      frame_bg_color: settings.frameBgColor,
      button_secondary_color: settings.buttonSecondaryColor,
      // Typography & UI
      font_family: settings.fontFamily,
      font_size: settings.fontSize,
      button_style: settings.buttonStyle,
      // General switches
      enable_registration: settings.enableRegistration,
      require_email_verification: settings.requireEmailVerification,
      max_storage_per_user: settings.maxStoragePerUser,
      // Social media links (for footer)
      social_facebook: settings.socialFacebook,
      social_instagram: settings.socialInstagram,
      social_tiktok: settings.socialTiktok,
      social_linkedin: settings.socialLinkedin,
      // Notification settings - NOTE: sendReportEmail maps to send_email_in_report
      send_welcome_email: settings.sendWelcomeEmail,
      send_completion_email: settings.sendCompletionEmail,
      send_email_in_report: settings.sendReportEmail,       // ← correct mapping
      send_admin_notification: settings.adminNotifyNewUser,
      // Payment settings
      enable_payments: settings.enablePayments,
      currency: settings.currency,
      vat_percentage: settings.vatPercentage,
      stripe_public_key: settings.stripePublicKey,
      stripe_secret_key: settings.stripeSecretKey,
    };

    console.log("📤 Sending settings to API:", {
      enable_registration: body.enable_registration,
      require_email_verification: body.require_email_verification,
      send_welcome_email: body.send_welcome_email,
      send_completion_email: body.send_completion_email,
      send_email_in_report: body.send_email_in_report,
      send_admin_notification: body.send_admin_notification,
      enable_payments: body.enable_payments,
      frame_bg_color: body.frame_bg_color,
      button_secondary_color: body.button_secondary_color,
    });

    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error("Failed to save settings");
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error("Error saving app settings:", error);
    return { success: false, error };
  }
};