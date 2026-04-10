// import { NextResponse } from "next/server";
// import connectDB from "@/lib/dbConnect";
// import Event from "../../../lib/models/Event";

// // ✅ GET all events
// export async function GET() {
//   await connectDB();

//   const events = await Event.find().sort({ createdAt: -1 });

//   return NextResponse.json(events);
// }

// // ✅ CREATE event
// export async function POST(req) {
//   await connectDB();

//   const body = await req.json();

//   const event = await Event.create(body);

//   return NextResponse.json(event);
// }
import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConnect";
import Event from "../../../lib/models/Event";
import nodemailer from "nodemailer";

export async function GET() {
  await connectDB();

  const events = await Event.find().sort({ createdAt: -1 });

  return NextResponse.json(events);
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    // ✅ Save event in DB
    const event = await Event.create(body);

    // ✅ Create transporter (INSIDE route)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ Send mail if assigned exists
    if (body.assigned && body.assigned.length > 0) {
      await transporter.sendMail({
        from: `"OORK-SPACE" <${process.env.EMAIL_USER}>`,
        to: body.assigned.join(","), // multiple emails
        subject: "📅 New Event Assigned",
        text: `
You have been assigned to an event:

Title: ${body.title}
Description: ${body.description}
Date: ${new Date(body.fromDate).toDateString()}
Time: ${body.time}
        `,
      });
    }
    console.log(event);
    return NextResponse.json(event);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Something went wrong" });
  }
}