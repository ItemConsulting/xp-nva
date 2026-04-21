import { create, modify, get, type CreateScheduledJobParams, type ScheduledJob } from "/lib/xp/scheduler";
import { submitTask } from "/lib/xp/task";
import { ensureRepoExists } from "/lib/nva";
import { runAsSu } from "/lib/nva/contexts";

const APP_NAME = app.name;
const IMPORT_TASK_DESCRIPTOR = `${APP_NAME}:import-nva-results`;

// Initialize on app start
runAsSu(() => {
  if (app.config.institution) {
    upsertScheduledJob({
      name: "nva-import-results",
      enabled: true,
      config: {},
      description: "Nightly import of NVA results for configured institution",
      descriptor: IMPORT_TASK_DESCRIPTOR,
      schedule: {
        type: "CRON",
        value: "0 3 * * *",
        timeZone: "Europe/Oslo",
      },
      user: "user:system:su",
    });

    const repoExisted = ensureRepoExists();

    if (!repoExisted) {
      log.info("NVA results repo is new — triggering immediate import");
      submitTask({
        descriptor: IMPORT_TASK_DESCRIPTOR,
        config: {},
      });
    }
  }

  log.info("NVA integration app initialized");
});

function upsertScheduledJob<Config extends Record<string, unknown>>(
  params: CreateScheduledJobParams<Config>,
): ScheduledJob<Config> {
  const job =
    get(params) === null
      ? create<Config>(params)
      : modify<Config>({
          name: params.name,
          editor: (scheduledJob) => ({
            ...scheduledJob,
            config: params.config,
            description: params.description,
            descriptor: params.descriptor,
            schedule: params.schedule,
            user: params.user ?? scheduledJob.user,
            enabled: params.enabled,
          }),
        });

  log.info(
    job.enabled
      ? `Scheduled job at ${formatCronValue(job.schedule.value)} named "${job.name}"`
      : `Disabled scheduled job "${job.name}"`,
  );

  return job;
}

function formatCronValue(cron: string): string {
  const [minutes, hours] = cron.split(" ");
  return `${padTime(hours)}:${padTime(minutes)}`;
}

function padTime(str: string): string {
  return str.length === 2 ? str : `0${str}`;
}
