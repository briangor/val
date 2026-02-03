import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { myValentine, noCount } = req.body || {};

        await resend.emails.send({
            from: "Valentine Bot <hello@0xb13.xyz>",
            to: process.env.NOTIFY_EMAIL,
            subject: "Happy Valentine's 🌹",
            text: `
            Hello there,

            ${myValentine || "Jane Doe"}😍💘 accepted your proposal! Hurrayyy!!

            She said no ${noCount ?? 0} times.

            Time: ${new Date().toLocaleString("en-GB", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            })
                }

            Regards,
            Cupid
                `
        });

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to send email" });
    }
}
