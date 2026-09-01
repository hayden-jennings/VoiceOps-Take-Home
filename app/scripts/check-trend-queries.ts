import { getCompetitivePriceTrend } from "@/lib/dashboards/priceTrend";
import { getObjectionOutcomeTrend } from "@/lib/dashboards/outcomeTrend";

async function main() {
  console.log("priceTrend (all):", JSON.stringify(await getCompetitivePriceTrend(), null, 2));
  console.log("priceTrend (State Farm):", JSON.stringify(await getCompetitivePriceTrend({ competitor: "State Farm" }), null, 2));
  console.log("outcomeTrend (all):", JSON.stringify(await getObjectionOutcomeTrend(), null, 2));
  console.log("outcomeTrend (PRICE):", JSON.stringify(await getObjectionOutcomeTrend({ objectionType: "PRICE" }), null, 2));
  process.exit(0);
}
main();
