import { auth } from "~/auth";
import PricingContent from "./PricingContent";

export default async function PricingPage() {
  const session = await auth();
  return <PricingContent isLoggedIn={!!session?.user} />;
}
