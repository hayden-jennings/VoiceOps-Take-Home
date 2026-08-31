import { listReps } from "@/lib/tools/listReps";
import { getCallDetail } from "@/lib/tools/getCallDetail";
import { searchTranscripts } from "@/lib/tools/searchTranscripts";
import { getRepPerformance } from "@/lib/tools/getRepPerformance";
import { listCalls } from "@/lib/tools/listCalls";
import { getCompetitiveIntelligence } from "@/lib/tools/getCompetitiveIntelligence";
import { getObjectionHandlingStats } from "@/lib/tools/getObjectionHandlingStats";
import { runReadonlySql } from "@/lib/tools/runReadonlySql";

async function main() {
  console.log("listReps:", JSON.stringify(await listReps(), null, 2));

  console.log(
    "getCallDetail(1):",
    JSON.stringify(await getCallDetail(1), null, 2)
  );
  console.log(
    "getCallDetail(999999):",
    JSON.stringify(await getCallDetail(999999), null, 2)
  );

  console.log(
    "searchTranscripts('State Farm'):",
    JSON.stringify(
      await searchTranscripts({ keyword: "State Farm", limit: 5 }),
      null,
      2
    )
  );

  console.log(
    "getRepPerformance({repName:'Sarah'}):",
    JSON.stringify(await getRepPerformance({ repName: "Sarah" }), null, 2)
  );

  console.log(
    "listCalls({summaryContains:'renewal', objectionOutcome:'LOST'}):",
    JSON.stringify(
      await listCalls({ summaryContains: "renewal", objectionOutcome: "LOST" }),
      null,
      2
    )
  );

  console.log(
    "getCompetitiveIntelligence({competitor:'State Farm'}):",
    JSON.stringify(
      await getCompetitiveIntelligence({ competitor: "State Farm" }),
      null,
      2
    )
  );

  console.log(
    "getObjectionHandlingStats({objectionType:'PRICE'}):",
    JSON.stringify(
      await getObjectionHandlingStats({ objectionType: "PRICE" }),
      null,
      2
    )
  );

  console.log(
    "runReadonlySql(valid select):",
    JSON.stringify(
      await runReadonlySql("select count(*) from calls"),
      null,
      2
    )
  );
  console.log(
    "runReadonlySql(write attempt):",
    JSON.stringify(
      await runReadonlySql("delete from calls where id = 1"),
      null,
      2
    )
  );
  console.log(
    "runReadonlySql(stacked statements):",
    JSON.stringify(
      await runReadonlySql("select 1; select 2"),
      null,
      2
    )
  );
  console.log(
    "runReadonlySql(timeout):",
    JSON.stringify(await runReadonlySql("select pg_sleep(10)"), null, 2)
  );

  process.exit(0);
}

main();
