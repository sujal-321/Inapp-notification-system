import { db } from "./index.js";
import { notificationTemplates } from "./schema.js";
import { sql } from "drizzle-orm";

export async function seedTemplates() {
  // Check if templates already exist
  const result = await db
    .select({ count: sql`COUNT(*)`.mapWith(Number) })
    .from(notificationTemplates);

  if (result[0].count > 0) {
    console.log("ℹ️ Templates already exist, skipping seed");
    return;
  }

  // Insert default templates
  await db.insert(notificationTemplates).values([
    {
      title: "Welcome Message",
      body: "Welcome {{name}}! Thanks for joining our platform."
    },
    {
      title: "Password Changed",
      body: "Hi {{name}}, your password was changed successfully."
    },
    {
      title: "Login Alert",
      body: "A new login was detected on your account."
    },
    {
      title: "Profile Updated",
      body: "Your profile information was updated successfully."
    },
    {
      title: "Subscription Activated",
      body: "Your subscription is now active."
    },
    {
      title: "Subscription Expired",
      body: "Your subscription has expired."
    },
    {
      title: "Payment Successful",
      body: "Your payment was successful."
    },
    {
      title: "Payment Failed",
      body: "Payment failed. Please try again."
    },
    {
      title: "System Maintenance",
      body: "System maintenance is scheduled soon."
    },
    {
      title: "Security Alert",
      body: "Suspicious activity detected on your account."
    }
  ]);

  console.log("✅ Default notification templates seeded");
}
