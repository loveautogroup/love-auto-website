import type { Metadata } from "next";
import WaitlistForm from "@/components/WaitlistForm";
import WaitlistIntro from "./WaitlistIntro";

export const metadata: Metadata = {
  title: "Car Waitlist | Tell Us What You're Looking For | Love Auto Group",
  description:
    "Don't see the car you want? Tell Love Auto Group in Villa Park, IL the make, body style, budget, or year range and we'll email you the day a match comes in.",
  alternates: { canonical: "https://www.loveautogroup.net/waitlist/" },
};

export default function WaitlistPage() {
  return (
    <>
      <WaitlistIntro />
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
          <WaitlistForm />
          <WaitlistIntro sidebar />
        </div>
      </section>
    </>
  );
}
