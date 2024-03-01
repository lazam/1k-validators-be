import { Job, JobConfig, JobRunnerMetadata } from "../JobsClass";
import logger from "../../../logger";
import { cronLabel } from "../cron/StartCronJobs";

export class StaleNominationJob extends Job {
  constructor(jobConfig: JobConfig, jobRunnerMetadata: JobRunnerMetadata) {
    super(jobConfig, jobRunnerMetadata);
  }
}

export const staleNominationJob = async (
  metadata: JobRunnerMetadata,
): Promise<boolean> => {
  try {
    const {
      constraints,
      ending,
      config,
      chaindata,
      nominatorGroups,
      nominating,
      bot,
      handler,
    } = metadata;

    const api = handler.getApi();

    if (!api) {
      logger.error(`api is null`, cronLabel);
      return false;
    }

    // threshold for a stale nomination - 8 eras for kusama, 2 eras for polkadot
    const threshold = config.global.networkPrefix == 2 ? 8 : 2;

    logger.info(`running stale cron....`, cronLabel);

    const currentEra = await chaindata.getCurrentEra();
    if (!currentEra) {
      logger.error(`current era is null`, cronLabel);
      return false;
    }
    // const allCandidates = await queries.allCandidates();

    for (const nom of nominatorGroups) {
      const stash = await nom.stash();
      if (!stash || stash === "0x") continue;

      const lastNominatedEra =
        await chaindata.getNominatorLastNominationEra(stash);
      // if (!nominatorsJson || nominatorsJson === null) continue;
      //
      // const submittedIn: number = nominatorsJson.submittedIn ?? 0;
      // const targets: string[] = nominatorsJson.targets ?? [];

      // for (const target of targets) {
      //   const isCandidate = allCandidates.filter(
      //     (candidate) => candidate.stash == target,
      //   );
      //
      //   if (isCandidate.length === 0) {
      //     const message = `Nominator ${stash} is nominating ${target}, which is not a 1kv candidate`;
      //     logger.info(message);
      //     if (bot) {
      //       await bot.sendMessage(message);
      //     }
      //   }
      // }

      if (lastNominatedEra < Number(currentEra) - threshold) {
        const message = `Nominator ${stash} has a stale nomination. Last nomination was in era ${nom.getStatus()?.lastNominationEra} (it is now era ${currentEra})`;
        logger.info(message, cronLabel);
        if (bot) {
          await bot.sendMessage(message);
        }
      }
    }
    return true;
  } catch (e) {
    logger.error(`Error in staleNominationJob:`, cronLabel);
    logger.error(JSON.stringify(e), cronLabel);
    return false;
  }
};
