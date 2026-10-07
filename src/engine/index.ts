/**
 * Point d'entrée public du moteur : données, règles métier et commandes.
 * Aucune dépendance à l'interface, au stockage ni aux thèmes.
 */
export * from './config.ts'
export * from './dates.ts'
export * from './model.ts'
export * from './habits/schedule.ts'
export * from './habits/streak.ts'
export * from './habits/recovery.ts'
export * from './habits/tiers.ts'
export * from './habits/frequency.ts'
export * from './goals/progress.ts'
export * from './commands/context.ts'
export * from './commands/habits.ts'
export * from './commands/tasks.ts'
export * from './commands/goals.ts'
export * from './commands/settings.ts'
export * from './calendar/month.ts'
export * from './calendar/dayState.ts'
export * from './calendar/chains.ts'
export * from './calendar/aggregate.ts'
export * from './calendar/monthData.ts'
