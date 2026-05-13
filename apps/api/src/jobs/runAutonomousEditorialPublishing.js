import 'dotenv/config.js';
import { AutonomousEditorialPublishingService } from '../services/autonomousEditorialPublishingService.js';

const parseArgs = () => {
  const args = new Set(process.argv.slice(2));
  const getValue = (name, fallback) => {
    const prefix = `--${name}=`;
    const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
    return found ? found.slice(prefix.length) : fallback;
  };

  return {
    shadow14: args.has('--shadow-14'),
    liveDiscovery: args.has('--live-discovery'),
    dryRun: !args.has('--real'),
    days: Number(getValue('days', '14')),
  };
};

const main = async () => {
  const options = parseArgs();
  const config = AutonomousEditorialPublishingService.getConfig();

  if (options.shadow14) {
    const result = await AutonomousEditorialPublishingService.runShadowMode({
      days: options.days,
      dailyLimit: config.dailyLimit,
      useLiveDiscovery: options.liveDiscovery,
    });

    console.log(JSON.stringify({
      mode: result.mode,
      dryRun: result.dryRun,
      autonomousReal: result.autonomousReal,
      published: result.published,
      distributed: result.distributed,
      cronReal: result.cronReal,
      dailyLimit: result.dailyLimit,
      summary: result.summary,
      readiness: result.readiness,
      distribution: result.simulation.distribution,
      discovery: {
        providers: result.simulation.discovery?.providers,
      },
      observability: {
        metrics: result.observability.metrics,
        alerts: result.observability.alerts,
        recommendations: result.observability.recommendations,
      },
      attemptedSlots: result.attemptedSlots,
      dayOneExamples: result.attemptedSlots.filter((item) => item.day === 1).slice(0, 3),
      safety: {
        published: false,
        distributed: false,
        cronReal: false,
        autonomousReal: false,
      },
    }, null, 2));
    return;
  }

  const result = await AutonomousEditorialPublishingService.runDaily({
    dryRun: options.dryRun,
    useLiveDiscovery: options.liveDiscovery,
  });

  console.log(JSON.stringify({
    ...result,
    config: {
      enabled: config.enabled,
      mode: config.mode,
      dailyLimit: config.dailyLimit,
      factoryPublishAllowed: config.factoryPublishAllowed,
    },
  }, null, 2));
};

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    status: 'failed',
    error: error.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  }, null, 2));
  process.exitCode = 1;
});
