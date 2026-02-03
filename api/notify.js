import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const xff = req.headers["x-forwarded-for"];
const ip = Array.isArray(xff) ? xff[0] : (xff?.split(",")[0]?.trim() ?? "unknown");

const ua = req.headers["user-agent"] || "unknown";
const lang = req.headers["accept-language"] || "unknown";

const country = req.headers["x-vercel-ip-country"] || "unknown";
const region = req.headers["x-vercel-ip-country-region"] || "unknown";
const city = req.headers["x-vercel-ip-city"] || "unknown";
const postal = req.headers["x-vercel-ip-postal-code"] || "unknown";


export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { myValentine, noCount, localTime } = req.body || {};

        await resend.emails.send({
            from: "Valentine Bot <hello@0xb13.xyz>",
            to: process.env.NOTIFY_EMAIL,
            subject: "Happy Valentine's 🌹",
            text: `
            Hello there,

            ${myValentine || "Jane Doe"}😍💘 accepted your proposal! Hurrayyy!!

            She said no ${noCount ?? 0} times.

            Time: ${localTime || new Date().toLocaleString("en-GB", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            })
                }

            Regards,
            Cupid

            --- Metadata ---
            IP: ${ip}
            Geo: ${city}, ${region}, ${country} (${postal})
            UA: ${ua}
            Lang: ${lang}
                `
        });

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to send email" });
    }
}
