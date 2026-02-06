import { db } from "./index.js";

export async function seedTemplates() {
  const { rows } = await db.query(
    "SELECT COUNT(*) FROM notification_templates"
  );

  if (Number(rows[0].count) > 0) return;

  await db.query(`
    INSERT INTO notification_templates (title, body) VALUES
    ('Welcome Message', 'Welcome {{name}}! Thanks for joining our platform.'),
    ('Password Changed', 'Hi {{name}}, your password was changed successfully.'),
    ('Login Alert', 'A new login was detected on your account.'),
    ('Profile Updated', 'Your profile information was updated successfully.'),
    ('Subscription Activated', 'Your subscription is now active.'),
    ('Subscription Expired', 'Your subscription has expired.'),
    ('Payment Successful', 'Your payment was successful.'),
    ('Payment Failed', 'Payment failed.'),
    ('System Maintenance', 'System maintenance scheduled soon.'),
    ('Security Alert', 'Suspicious activity detected.')
  `);

  console.log("✅ Default templates seeded");
}
