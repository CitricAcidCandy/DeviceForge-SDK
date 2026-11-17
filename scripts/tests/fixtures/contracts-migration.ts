import type { components, paths } from '@deviceforge/contracts/api';

type Equal<Actual, Expected> =
  (<Value>() => Value extends Actual ? 1 : 2) extends
  (<Value>() => Value extends Expected ? 1 : 2) ? true : false;
type Assert<Condition extends true> = Condition;

type MigrationPlan = components['schemas']['PluginMigrationPlan'];
type PlanRequest = components['schemas']['PluginMigrationPlanRequest'];
type MigrationRequest = components['schemas']['PluginMigrationRequest'];
type PlanOperation = paths['/api/v2/plugin-installations/migration-plan']['post'];
type MigrationOperation = paths['/api/v2/plugin-installations/migrate']['post'];
type PlanInput = PlanOperation['requestBody']['content']['application/json'];
type PlanOutput = PlanOperation['responses'][200]['content']['application/json']['data'];
type MigrationInput = MigrationOperation['requestBody']['content']['application/json'];
type MigrationOutput = MigrationOperation['responses'][202]['content']['application/json']['data'];
type Configuration = MigrationPlan['configurations'][number];

export type MigrationContractAssertions = [
  Assert<Equal<Configuration['revision'], string | null>>,
  Assert<Equal<PlanOutput['configurations'][number]['revision'], string | null>>,
  Assert<Equal<MigrationInput['plan']['configurations'][number]['revision'], string | null>>,
  Assert<Equal<MigrationRequest['plan']['configurations'][number]['revision'], string | null>>,
  Assert<Equal<{} extends Pick<Configuration, 'revision'> ? true : false, false>>,
  Assert<Equal<PlanInput, PlanRequest>>,
  Assert<Equal<PlanOutput, MigrationPlan>>,
  Assert<Equal<MigrationInput, MigrationRequest>>,
  Assert<Equal<MigrationOutput, components['schemas']['JobResponse']['data']>>,
  Assert<Equal<MigrationInput['confirmed'], boolean>>,
  Assert<Equal<Configuration['kind'], 'server' | 'browser'>>,
  Assert<Equal<'values' extends keyof Configuration ? true : false, false>>,
  Assert<Equal<Extract<PlanInput['source'], { kind: 'offline' }>['artifact_id'], string>>,
  Assert<Equal<Extract<PlanInput['source'], { kind: 'market' }>['manifest_sha256'], string>>,
];
