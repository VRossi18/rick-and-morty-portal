import clsx from 'clsx';
import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildCharacterSheetExport } from './buildCharacterSheetExport';
import type { CharacterSheetExportTranslate } from './buildCharacterSheetExport';
import {
   downloadJsonFile,
   formatBonus,
   mechanicalDrawbackParts,
   raceSkillName,
   raceSkillSummary,
   slugForFilename,
   totalToD20Mod,
} from './characterSheetUiHelpers';
import { BASE_SCORE, MAX_SCORE_BEFORE_RACE } from './characterCreationMath';
import { CHARACTER_PRESETS } from './presets';
import { RacePortrait } from './RacePortrait';
import { buildDerivedSheet } from './rpgDerivedSheet';
import { RACES, getRaceById } from './races';
import { useCharacterCreation } from './useCharacterCreation';
import { ABILITY_IDS } from './types';
import type { AbilityId, AbilityScores, RaceId } from './types';

interface CharacterCreationSnapshot {
   characterName: string;
   selectedRaceId: RaceId;
   scores: AbilityScores;
   sheetRacialBonus: Record<AbilityId, number>;
   sheetDrawback: Record<AbilityId, number>;
   totals: AbilityScores;
   highTotalFlags: Record<AbilityId, boolean>;
   spent: number;
   remaining: number;
   humanBonusChoices: [AbilityId, AbilityId];
}

export function CharacterSheetContainer() {
   const { t, i18n } = useTranslation('common');
   const exportDialogRef = useRef<HTMLDialogElement>(null);
   const createConfirmDialogRef = useRef<HTMLDialogElement>(null);
   const createdSummaryDialogRef = useRef<HTMLDialogElement>(null);
   const exportDialogTitleId = useId();
   const exportDialogDescId = useId();
   const createConfirmTitleId = useId();
   const createConfirmDescId = useId();
   const createdSummaryTitleId = useId();
   const cheatSheetSectionId = useId();
   const [creationSnapshot, setCreationSnapshot] = useState<CharacterCreationSnapshot | null>(null);
   const {
      characterName,
      setCharacterName,
      selectedPresetId,
      selectedRaceId,
      selectedRace,
      scores,
      sheetRacialBonus,
      sheetDrawback,
      spent,
      remaining,
      totals,
      highTotalFlags,
      setRace,
      applyPreset,
      incrementAbility,
      decrementAbility,
      humanBonusChoices,
      setHumanBonusSlot,
   } = useCharacterCreation();

   const nameTrimmed = characterName.trim();
   const previewName = t(`rpg.races.${selectedRace.id}.name` as 'rpg.title');
   const previewAlt = t(`rpg.races.${selectedRace.id}.imageAlt` as 'rpg.title');
   const previewVisual = t(`rpg.races.${selectedRace.id}.visualDescription` as 'rpg.title');
   const previewDrawback = t(`rpg.races.${selectedRace.id}.drawbackDescription` as 'rpg.title');
   const derived = useMemo(
      () => buildDerivedSheet(totals, selectedRaceId),
      [totals, selectedRaceId],
   );
   const summaryDerived = useMemo(
      () =>
         creationSnapshot
            ? buildDerivedSheet(creationSnapshot.totals, creationSnapshot.selectedRaceId)
            : null,
      [creationSnapshot],
   );

   const mechanicalDrawbackLines = mechanicalDrawbackParts(sheetDrawback, (key) =>
      t(key as 'rpg.title'),
   );
   const drawbackFlavorTrimmed = previewDrawback
      .replace(/[\u2014\u2013-]/g, '')
      .replace(/\s/g, '')
      .trim();
   const hasFlavorDrawback = previewDrawback.length > 0 && drawbackFlavorTrimmed.length > 0;
   const selectedPreset = useMemo(
      () => CHARACTER_PRESETS.find((preset) => preset.id === selectedPresetId) ?? null,
      [selectedPresetId],
   );

   const canExportJson = remaining === 0 && nameTrimmed.length > 0;

   const performExportJson = useCallback(() => {
      const trimmed = characterName.trim();
      if (remaining !== 0 || trimmed.length === 0) {
         return;
      }
      const payload = buildCharacterSheetExport(t as unknown as CharacterSheetExportTranslate, {
         exportedAt: new Date().toISOString(),
         locale: i18n.language,
         characterName: trimmed,
         selectedRaceId,
         selectedRace,
         scores,
         sheetRacialBonus,
         sheetDrawback,
         totals,
         highTotalFlags,
         spent,
         remaining,
         humanBonusChoices,
      });
      const safeIso = new Date().toISOString().replaceAll(':', '-');
      downloadJsonFile(
         `rnm-rpg-${slugForFilename(trimmed)}-${selectedRaceId}-${safeIso}.json`,
         payload,
      );
   }, [
      t,
      characterName,
      i18n.language,
      humanBonusChoices,
      remaining,
      scores,
      selectedRace,
      selectedRaceId,
      sheetDrawback,
      sheetRacialBonus,
      spent,
      totals,
      highTotalFlags,
   ]);

   const openExportConfirmDialog = useCallback(() => {
      if (remaining !== 0 || characterName.trim().length === 0) {
         return;
      }
      exportDialogRef.current?.showModal();
   }, [remaining, characterName]);

   const exportButtonTitle =
      remaining > 0
         ? t('rpg.exportBlockedHint')
         : nameTrimmed.length === 0
           ? t('rpg.exportBlockedNameHint')
           : undefined;
   const exportButtonAriaLabel = canExportJson
      ? t('rpg.exportJsonAria')
      : remaining > 0
        ? t('rpg.exportBlockedAria')
        : t('rpg.exportBlockedNameAria');

   const createButtonTitle =
      remaining > 0
         ? t('rpg.createBlockedHint')
         : nameTrimmed.length === 0
           ? t('rpg.exportBlockedNameHint')
           : undefined;
   const createButtonAriaLabel = canExportJson
      ? t('rpg.createCharacterAria')
      : t('rpg.createBlockedAria');

   const closeExportConfirmDialog = useCallback(() => {
      exportDialogRef.current?.close();
   }, []);

   const handleConfirmExport = useCallback(() => {
      performExportJson();
      closeExportConfirmDialog();
   }, [performExportJson, closeExportConfirmDialog]);

   const downloadExportForSnapshot = useCallback(
      (snap: CharacterCreationSnapshot) => {
         const trimmed = snap.characterName.trim();
         const payload = buildCharacterSheetExport(t as unknown as CharacterSheetExportTranslate, {
            exportedAt: new Date().toISOString(),
            locale: i18n.language,
            characterName: trimmed,
            selectedRaceId: snap.selectedRaceId,
            selectedRace: getRaceById(snap.selectedRaceId),
            scores: snap.scores,
            sheetRacialBonus: snap.sheetRacialBonus,
            sheetDrawback: snap.sheetDrawback,
            totals: snap.totals,
            highTotalFlags: snap.highTotalFlags,
            spent: snap.spent,
            remaining: snap.remaining,
            humanBonusChoices: snap.humanBonusChoices,
         });
         const safeIso = new Date().toISOString().replaceAll(':', '-');
         downloadJsonFile(
            `rnm-rpg-${slugForFilename(trimmed)}-${snap.selectedRaceId}-${safeIso}.json`,
            payload,
         );
      },
      [t, i18n.language],
   );

   const openCreateConfirmDialog = useCallback(() => {
      if (remaining !== 0 || characterName.trim().length === 0) {
         return;
      }
      createConfirmDialogRef.current?.showModal();
   }, [remaining, characterName]);

   const closeCreateConfirmDialog = useCallback(() => {
      createConfirmDialogRef.current?.close();
   }, []);

   const handleConfirmCreateCharacter = useCallback(() => {
      const trimmed = characterName.trim();
      if (remaining !== 0 || trimmed.length === 0) {
         return;
      }
      setCreationSnapshot({
         characterName,
         selectedRaceId,
         scores: { ...scores },
         sheetRacialBonus: { ...sheetRacialBonus },
         sheetDrawback: { ...sheetDrawback },
         totals: { ...totals },
         highTotalFlags: { ...highTotalFlags },
         spent,
         remaining,
         humanBonusChoices: [humanBonusChoices[0], humanBonusChoices[1]],
      });
      createConfirmDialogRef.current?.close();
      queueMicrotask(() => {
         createdSummaryDialogRef.current?.showModal();
      });
   }, [
      characterName,
      humanBonusChoices,
      remaining,
      scores,
      selectedRaceId,
      sheetDrawback,
      sheetRacialBonus,
      spent,
      totals,
      highTotalFlags,
   ]);

   const closeCreatedSummaryDialog = useCallback(() => {
      createdSummaryDialogRef.current?.close();
   }, []);

   const handleExportFromCreatedSummary = useCallback(() => {
      if (!creationSnapshot) {
         return;
      }
      downloadExportForSnapshot(creationSnapshot);
   }, [creationSnapshot, downloadExportForSnapshot]);

   return (
      <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 md:py-12">
         <header className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
               {t('rpg.title')}
            </h1>
            <p className="text-sm text-muted-foreground md:max-w-2xl">{t('rpg.subtitle')}</p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-start">
               <p className="text-sm font-semibold text-primary">
                  {t('rpg.poolSummary', { spent, remaining })}
               </p>
               <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <button
                     type="button"
                     onClick={openCreateConfirmDialog}
                     disabled={!canExportJson}
                     title={createButtonTitle}
                     className={clsx(
                        'rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-color)]',
                        canExportJson
                           ? 'border-emerald-500/70 bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25 dark:text-emerald-200'
                           : 'cursor-not-allowed border-border/60 bg-muted/30 text-muted-foreground',
                     )}
                     aria-label={createButtonAriaLabel}
                  >
                     {t('rpg.createCharacter')}
                  </button>
                  <button
                     type="button"
                     onClick={openExportConfirmDialog}
                     disabled={!canExportJson}
                     title={exportButtonTitle}
                     className={clsx(
                        'rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-color)]',
                        canExportJson
                           ? 'border-primary/60 bg-primary/10 text-primary hover:bg-primary/15'
                           : 'cursor-not-allowed border-border/60 bg-muted/30 text-muted-foreground',
                     )}
                     aria-label={exportButtonAriaLabel}
                  >
                     {t('rpg.exportJson')}
                  </button>
               </div>
            </div>
            {remaining > 0 ? (
               <p className="text-center text-xs text-muted-foreground sm:text-left" role="status">
                  {t('rpg.createBlockedHint')}
               </p>
            ) : null}
            {remaining === 0 && nameTrimmed.length === 0 ? (
               <p className="text-center text-xs text-muted-foreground sm:text-left" role="status">
                  {t('rpg.exportBlockedNameHint')}
               </p>
            ) : null}
         </header>

         <section
            aria-labelledby="rpg-presets-heading"
            className="rounded-2xl border border-border/80 bg-card/40 p-4 md:p-5"
         >
            <h2 id="rpg-presets-heading" className="text-lg font-bold text-foreground">
               {t('rpg.presets.title')}
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
               {CHARACTER_PRESETS.map((preset) => (
                  <button
                     key={preset.id}
                     type="button"
                     onClick={() => applyPreset(preset)}
                     className="rounded-xl border border-border/80 bg-background/50 p-3 text-left transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  >
                     <p className="text-sm font-bold text-foreground">{t(preset.labelKey)}</p>
                     <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {t(preset.descriptionKey)}
                     </p>
                     <p className="mt-2 text-xs font-semibold text-primary">{t('rpg.presets.apply')}</p>
                  </button>
               ))}
            </div>
         </section>

         <section
            aria-labelledby="rpg-character-heading"
            className="rounded-2xl border border-border/80 bg-card/40 p-4 md:p-5"
         >
            <h2 id="rpg-character-heading" className="text-lg font-bold text-foreground">
               {t('rpg.characterHeading')}
            </h2>
            <label className="mt-3 block max-w-xl text-sm">
               <span className="text-muted-foreground">{t('rpg.characterNameLabel')}</span>
               <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder={t('rpg.characterNamePlaceholder')}
                  maxLength={80}
                  autoComplete="off"
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-green-400"
                  aria-label={t('rpg.characterNameLabel')}
               />
            </label>
         </section>

         <dialog
            ref={exportDialogRef}
            className="fixed left-1/2 top-1/2 z-50 m-0 max-h-[min(90vh,32rem)] w-[min(100%,24rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-foreground shadow-2xl backdrop:bg-black/55"
            aria-labelledby={exportDialogTitleId}
            aria-describedby={exportDialogDescId}
         >
            <div className="space-y-4">
               <h2 id={exportDialogTitleId} className="text-lg font-black tracking-tight">
                  {t('rpg.exportConfirmTitle')}
               </h2>
               <p id={exportDialogDescId} className="text-sm text-muted-foreground">
                  {t('rpg.exportConfirmDescription')}
               </p>
               <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                     type="button"
                     onClick={closeExportConfirmDialog}
                     className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  >
                     {t('rpg.exportConfirmCancel')}
                  </button>
                  <button
                     type="button"
                     onClick={handleConfirmExport}
                     className="rounded-lg border border-primary/60 bg-primary/15 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  >
                     {t('rpg.exportConfirmDownload')}
                  </button>
               </div>
            </div>
         </dialog>

         <dialog
            ref={createConfirmDialogRef}
            className="fixed left-1/2 top-1/2 z-50 m-0 max-h-[min(90vh,32rem)] w-[min(100%,24rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-foreground shadow-2xl backdrop:bg-black/55"
            aria-labelledby={createConfirmTitleId}
            aria-describedby={createConfirmDescId}
         >
            <div className="space-y-4">
               <h2 id={createConfirmTitleId} className="text-lg font-black tracking-tight">
                  {t('rpg.createConfirmTitle')}
               </h2>
               <p id={createConfirmDescId} className="text-sm text-muted-foreground">
                  {t('rpg.createConfirmDescription')}
               </p>
               <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                     type="button"
                     onClick={closeCreateConfirmDialog}
                     className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  >
                     {t('rpg.createConfirmBack')}
                  </button>
                  <button
                     type="button"
                     onClick={handleConfirmCreateCharacter}
                     className="rounded-lg border border-emerald-500/60 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 dark:text-emerald-200"
                  >
                     {t('rpg.createConfirmYes')}
                  </button>
               </div>
            </div>
         </dialog>

         <section aria-labelledby="rpg-race-heading" className="space-y-4">
            <h2 id="rpg-race-heading" className="text-lg font-bold text-foreground">
               {t('rpg.raceHeading')}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
               {RACES.map((race) => {
                  const selected = selectedRaceId === race.id;
                  const name = t(`rpg.races.${race.id}.name` as 'rpg.title');
                  const imageAlt = t(`rpg.races.${race.id}.imageAlt` as 'rpg.title');
                  const visualDescription = t(
                     `rpg.races.${race.id}.visualDescription` as 'rpg.title',
                  );
                  const a1 = raceSkillName(t, race.id, 'attack1');
                  const a2 = raceSkillName(t, race.id, 'attack2');
                  const su = raceSkillName(t, race.id, 'support');
                  return (
                     <button
                        key={race.id}
                        type="button"
                        onClick={() => setRace(race.id)}
                        aria-pressed={selected}
                        aria-label={t('rpg.raceSelectAria', { race: name })}
                        className={clsx(
                           'group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card text-left transition outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-color)]',
                           selected
                              ? 'border-green-400/90 ring-2 ring-green-400 ring-offset-2 ring-offset-[var(--bg-color)]'
                              : 'border-border/80 hover:border-green-400/45',
                        )}
                     >
                        <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-card">
                           <RacePortrait
                              race={race}
                              imageAlt={imageAlt}
                              imgClassName="h-full w-full object-cover object-center"
                           />
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col space-y-2 p-4 pt-3">
                           <p className="text-base font-bold text-foreground">{name}</p>
                           <p className="text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground/80">
                                 {t('rpg.cheatSheet.raceCardSkills')}:{' '}
                              </span>
                              <span className="line-clamp-2">
                                 {a1} · {a2} · {su}
                              </span>
                           </p>
                           <p className="text-xs leading-relaxed text-muted-foreground">
                              {visualDescription}
                           </p>
                        </div>
                     </button>
                  );
               })}
            </div>
         </section>

         <section
            aria-labelledby="rpg-selected-race-heading"
            className="rounded-2xl border border-green-400/40 bg-card/30 p-4 ring-2 ring-green-400/50 ring-offset-2 ring-offset-[var(--bg-color)] md:p-6"
         >
            <h2 id="rpg-selected-race-heading" className="sr-only">
               {t('rpg.selectedRacePreview')}
            </h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
               <div className="mx-auto h-44 w-44 shrink-0 overflow-hidden rounded-2xl border border-green-400/50 bg-card shadow-md shadow-green-500/15 sm:mx-0 sm:h-48 sm:w-48">
                  <RacePortrait
                     race={selectedRace}
                     imageAlt={previewAlt}
                     imgClassName="h-full w-full object-cover object-center"
                     portraitUrl={selectedPreset?.portraitUrl}
                  />
               </div>
               <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                     {t('rpg.selectedRacePreview')}
                  </p>
                  {nameTrimmed ? (
                     <>
                        <p className="mt-1 text-2xl font-black tracking-tight text-primary">
                           {nameTrimmed}
                        </p>
                        <p className="mt-1 text-lg font-bold text-foreground">
                           <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('rpg.raceHeading')}{' '}
                           </span>
                           {previewName}
                        </p>
                     </>
                  ) : (
                     <p className="mt-1 text-2xl font-black text-foreground">{previewName}</p>
                  )}
                  <div className="mt-3 space-y-2 text-left text-sm text-muted-foreground">
                     <p className="font-semibold text-foreground/90">
                        {t('rpg.cheatSheet.raceSkillsTitle')}
                     </p>
                     <ul className="space-y-2 text-xs leading-relaxed">
                        <li>
                           <span className="font-semibold text-foreground/85">
                              {t('rpg.cheatSheet.attacksHeading')} 1:{' '}
                           </span>
                           <span className="font-semibold text-foreground/90">
                              {raceSkillName(t, selectedRace.id, 'attack1')}
                           </span>{' '}
                           — {raceSkillSummary(t, selectedRace.id, 'attack1')}
                        </li>
                        <li>
                           <span className="font-semibold text-foreground/85">
                              {t('rpg.cheatSheet.attacksHeading')} 2:{' '}
                           </span>
                           <span className="font-semibold text-foreground/90">
                              {raceSkillName(t, selectedRace.id, 'attack2')}
                           </span>{' '}
                           — {raceSkillSummary(t, selectedRace.id, 'attack2')}
                        </li>
                        <li>
                           <span className="font-semibold text-foreground/85">
                              {t('rpg.cheatSheet.supportHeading')}:{' '}
                           </span>
                           <span className="font-semibold text-foreground/90">
                              {raceSkillName(t, selectedRace.id, 'support')}
                           </span>{' '}
                           — {raceSkillSummary(t, selectedRace.id, 'support')}
                        </li>
                        <li>
                           <span className="font-semibold text-foreground/85">
                              {t('rpg.cheatSheet.itemHeading')}:{' '}
                           </span>
                           <span className="font-semibold text-foreground/90">
                              {raceSkillName(t, selectedRace.id, 'item')}
                           </span>{' '}
                           — {raceSkillSummary(t, selectedRace.id, 'item')}
                        </li>
                     </ul>
                  </div>
                  {selectedRaceId === 'humans' ? (
                     <p className="mt-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-foreground/90">
                        <span className="font-bold text-primary">
                           {t('rpg.human.playstyleTitle')}:{' '}
                        </span>
                        {t('rpg.human.playstyleSummary')}
                     </p>
                  ) : null}
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                     {previewVisual}
                  </p>
                  <div className="mt-2 space-y-1.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-left text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                     <p className="text-xs font-bold uppercase tracking-wide text-amber-900/90 dark:text-amber-200/95">
                        {t('rpg.raceDrawbackMechanical')}
                     </p>
                     <p className="text-sm font-mono font-semibold leading-relaxed text-amber-900 dark:text-amber-50">
                        {mechanicalDrawbackLines.length > 0
                           ? mechanicalDrawbackLines.join(' · ')
                           : t('rpg.raceDrawbackNone')}
                     </p>
                     {hasFlavorDrawback ? (
                        <p className="text-xs leading-relaxed text-amber-900/85 dark:text-amber-100/90">
                           <span className="font-semibold text-foreground/90">
                              {t('rpg.raceDrawbackFlavor')}:{' '}
                           </span>
                           {previewDrawback}
                        </p>
                     ) : null}
                  </div>
               </div>
            </div>
         </section>

         {selectedRaceId === 'humans' ? (
            <section
               aria-labelledby="rpg-human-bonus-heading"
               className="rounded-2xl border border-border/80 bg-card/40 p-4 md:p-5"
            >
               <h2 id="rpg-human-bonus-heading" className="text-base font-bold text-foreground">
                  {t('rpg.humanBonusHeading')}
               </h2>
               <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
                  <label className="block min-w-0 flex-1 text-sm">
                     <span className="text-muted-foreground">{t('rpg.humanBonusSlot1')}</span>
                     <select
                        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                        value={humanBonusChoices[0]}
                        onChange={(e) => setHumanBonusSlot(0, e.target.value as AbilityId)}
                     >
                        {ABILITY_IDS.map((id) => (
                           <option key={id} value={id} disabled={id === humanBonusChoices[1]}>
                              {t(`rpg.abilities.${id}` as 'rpg.title')}
                           </option>
                        ))}
                     </select>
                  </label>
                  <label className="block min-w-0 flex-1 text-sm">
                     <span className="text-muted-foreground">{t('rpg.humanBonusSlot2')}</span>
                     <select
                        className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                        value={humanBonusChoices[1]}
                        onChange={(e) => setHumanBonusSlot(1, e.target.value as AbilityId)}
                     >
                        {ABILITY_IDS.map((id) => (
                           <option key={id} value={id} disabled={id === humanBonusChoices[0]}>
                              {t(`rpg.abilities.${id}` as 'rpg.title')}
                           </option>
                        ))}
                     </select>
                  </label>
               </div>
            </section>
         ) : null}

         <section
            id={cheatSheetSectionId}
            aria-labelledby="rpg-cheatsheet-heading"
            className="rounded-2xl border border-border/80 bg-card/40 p-4 md:p-5"
         >
            <h2 id="rpg-cheatsheet-heading" className="text-lg font-bold text-foreground">
               {t('rpg.cheatSheet.title')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('rpg.cheatSheet.description')}</p>
            <dl className="mt-4 space-y-4 text-sm">
               <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
                  <dt className="font-semibold text-foreground">
                     {t('rpg.cheatSheet.hitPointsLabel')}
                  </dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-primary">
                     {derived.hitPointsMax}
                  </dd>
                  <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
                     {t('rpg.cheatSheet.hitPointsHelp')}
                  </dd>
               </div>
               <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
                  <dt className="font-semibold text-foreground">
                     {t('rpg.cheatSheet.physicalLabel')}
                  </dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-primary">
                     {derived.physicalAttackRating}
                  </dd>
                  <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
                     {t('rpg.cheatSheet.physicalHelp')}
                  </dd>
               </div>
               <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
                  <dt className="font-semibold text-foreground">
                     {t('rpg.cheatSheet.magicalLabel')}
                  </dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-primary">
                     {derived.magicalAttackRating}
                  </dd>
                  <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
                     {t('rpg.cheatSheet.magicalHelp')}
                  </dd>
               </div>
               <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
                  <dt className="font-semibold text-foreground">
                     {t('rpg.cheatSheet.socialLabel')}
                  </dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-primary">
                     {derived.socialInfluencePool}
                  </dd>
                  <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
                     {t('rpg.cheatSheet.socialHelp')}
                  </dd>
               </div>
               <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
                  <dt className="font-semibold text-foreground">
                     {t('rpg.cheatSheet.stealthLabel')}
                  </dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-primary">
                     {derived.stealthRating}
                     {derived.stealthRacialBonus > 0 ? (
                        <span className="ml-2 text-xs font-normal text-emerald-700 dark:text-emerald-300">
                           {t('rpg.cheatSheet.stealthAffinity', {
                              bonus: derived.stealthRacialBonus,
                           })}
                        </span>
                     ) : null}
                  </dd>
                  <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
                     {t('rpg.cheatSheet.stealthHelp')}
                  </dd>
               </div>
               <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
                  <dt className="font-semibold text-foreground">
                     {t('rpg.cheatSheet.dexSpeedLabel')}
                  </dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-primary">
                     {derived.extraStrikesBeforeEnemy}{' '}
                     <span className="text-xs font-normal text-muted-foreground">
                        ({t('rpg.cheatSheet.dexTierLabel')}: {derived.dexSpeedTier})
                     </span>
                  </dd>
                  <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
                     {t('rpg.cheatSheet.dexSpeedHelp')}
                  </dd>
               </div>
            </dl>
            <details className="mt-4 rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
               <summary className="cursor-pointer font-semibold text-foreground/90">
                  {t('rpg.cheatSheet.formulasToggle')}
               </summary>
               <ul className="mt-2 list-inside list-disc space-y-1.5 leading-relaxed">
                  <li>{t('rpg.derivedFormulas.hitPoints')}</li>
                  <li>{t('rpg.derivedFormulas.physicalAttack')}</li>
                  <li>{t('rpg.derivedFormulas.magicalAttack')}</li>
                  <li>{t('rpg.derivedFormulas.socialPool')}</li>
                  <li>{t('rpg.derivedFormulas.dexSpeed')}</li>
                  <li>{t('rpg.derivedFormulas.stealth')}</li>
               </ul>
            </details>
         </section>

         <section
            aria-labelledby="rpg-abilities-heading"
            aria-describedby={cheatSheetSectionId}
            className="space-y-4"
         >
            <h2 id="rpg-abilities-heading" className="text-lg font-bold text-foreground">
               {t('rpg.abilitiesHeading')}
            </h2>
            <ul className="space-y-4">
               {ABILITY_IDS.map((id) => {
                  const raceBonus = sheetRacialBonus[id];
                  const drawback = sheetDrawback[id];
                  const total = totals[id];
                  const invested = scores[id] - BASE_SCORE;
                  const warn = highTotalFlags[id];
                  return (
                     <li
                        key={id}
                        className="rounded-2xl border border-border/80 bg-card/40 p-4 md:flex md:items-center md:justify-between md:gap-6"
                     >
                        <div className="min-w-0 flex-1">
                           <p className="text-sm font-bold text-foreground">
                              {t(`rpg.abilities.${id}` as 'rpg.title')}
                           </p>
                           <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3 md:grid-cols-5">
                              <div>
                                 <dt className="text-muted-foreground">{t('rpg.sheetBase')}</dt>
                                 <dd className="font-mono text-sm font-semibold">{BASE_SCORE}</dd>
                              </div>
                              <div>
                                 <dt className="text-muted-foreground">{t('rpg.sheetInvested')}</dt>
                                 <dd className="font-mono text-sm font-semibold">
                                    {invested > 0 ? `+${invested}` : '0'}
                                 </dd>
                              </div>
                              <div>
                                 <dt className="text-muted-foreground">{t('rpg.sheetRacial')}</dt>
                                 <dd
                                    className={clsx(
                                       'font-mono text-sm font-semibold',
                                       raceBonus > 0 && 'text-emerald-600 dark:text-emerald-400',
                                    )}
                                 >
                                    {formatBonus(raceBonus)}
                                 </dd>
                              </div>
                              <div>
                                 <dt className="text-muted-foreground">{t('rpg.sheetDrawback')}</dt>
                                 <dd
                                    className={clsx(
                                       'font-mono text-sm font-semibold',
                                       drawback < 0 && 'text-rose-600 dark:text-rose-400',
                                    )}
                                 >
                                    {formatBonus(drawback)}
                                 </dd>
                              </div>
                              <div>
                                 <dt className="text-muted-foreground">{t('rpg.sheetTotal')}</dt>
                                 <dd
                                    className={clsx(
                                       'font-mono text-lg font-black',
                                       warn && 'text-amber-600 dark:text-amber-400',
                                    )}
                                 >
                                    {total}
                                 </dd>
                              </div>
                           </dl>
                           {warn ? (
                              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                                 {t('rpg.highTotalHint')}
                              </p>
                           ) : null}
                        </div>
                        <div className="mt-4 flex shrink-0 gap-2 md:mt-0">
                           <button
                              type="button"
                              onClick={() => decrementAbility(id)}
                              disabled={scores[id] <= BASE_SCORE}
                              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:border-destructive/50 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`${t('rpg.decrement')} ${t(`rpg.abilities.${id}` as 'rpg.title')}`}
                           >
                              −
                           </button>
                           <button
                              type="button"
                              onClick={() => incrementAbility(id)}
                              disabled={scores[id] >= MAX_SCORE_BEFORE_RACE || remaining <= 0}
                              className="rounded-lg border border-primary/50 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`${t('rpg.increment')} ${t(`rpg.abilities.${id}` as 'rpg.title')}`}
                           >
                              +
                           </button>
                        </div>
                     </li>
                  );
               })}
            </ul>
         </section>

         <dialog
            ref={createdSummaryDialogRef}
            onClose={() => setCreationSnapshot(null)}
            className="fixed left-1/2 top-1/2 z-[60] m-0 max-h-[min(92vh,44rem)] w-[min(100%,42rem)] max-w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-emerald-500/35 bg-card p-5 text-foreground shadow-2xl backdrop:bg-black/60 md:p-7"
            aria-labelledby={createdSummaryTitleId}
         >
            {creationSnapshot && summaryDerived ? (
               <div className="space-y-6">
                  <header className="border-b border-border/60 pb-4">
                     <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                        {t('rpg.createdTitle')}
                     </p>
                     <h2
                        id={createdSummaryTitleId}
                        className="mt-1 text-2xl font-black tracking-tight text-foreground"
                     >
                        {creationSnapshot.characterName.trim()}
                     </h2>
                     <p className="mt-1 text-sm text-muted-foreground">
                        {t('rpg.createdSubtitle')}
                     </p>
                     <p className="mt-2 text-base font-semibold text-primary">
                        {t(`rpg.races.${creationSnapshot.selectedRaceId}.name` as 'rpg.title')}
                     </p>
                  </header>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                     <div className="mx-auto h-36 w-36 shrink-0 overflow-hidden rounded-2xl border border-emerald-500/40 bg-card shadow-md sm:mx-0">
                        <RacePortrait
                           race={getRaceById(creationSnapshot.selectedRaceId)}
                           imageAlt={t(
                              `rpg.races.${creationSnapshot.selectedRaceId}.imageAlt` as 'rpg.title',
                           )}
                           imgClassName="h-full w-full object-cover object-center"
                        />
                     </div>
                     <div className="min-w-0 flex-1 space-y-3">
                        <h3 className="text-sm font-bold text-foreground">
                           {t('rpg.cheatSheet.title')}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                           <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('rpg.cheatSheet.hitPointsLabel')}
                              </p>
                              <p className="font-mono text-lg font-bold text-primary">
                                 {summaryDerived.hitPointsMax}
                              </p>
                           </div>
                           <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('rpg.cheatSheet.physicalLabel')}
                              </p>
                              <p className="font-mono text-lg font-bold text-primary">
                                 {summaryDerived.physicalAttackRating}
                              </p>
                           </div>
                           <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('rpg.cheatSheet.magicalLabel')}
                              </p>
                              <p className="font-mono text-lg font-bold text-primary">
                                 {summaryDerived.magicalAttackRating}
                              </p>
                           </div>
                           <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('rpg.cheatSheet.socialLabel')}
                              </p>
                              <p className="font-mono text-lg font-bold text-primary">
                                 {summaryDerived.socialInfluencePool}
                              </p>
                           </div>
                           <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('rpg.cheatSheet.stealthLabel')}
                              </p>
                              <p className="font-mono text-lg font-bold text-primary">
                                 {summaryDerived.stealthRating}
                              </p>
                              {summaryDerived.stealthRacialBonus > 0 ? (
                                 <p className="mt-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">
                                    {t('rpg.cheatSheet.stealthAffinity', {
                                       bonus: summaryDerived.stealthRacialBonus,
                                    })}
                                 </p>
                              ) : null}
                           </div>
                           <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2 text-center">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                 {t('rpg.cheatSheet.dexSpeedLabel')}
                              </p>
                              <p className="font-mono text-lg font-bold text-primary">
                                 {summaryDerived.extraStrikesBeforeEnemy}
                                 <span className="text-xs font-normal text-muted-foreground">
                                    {' '}
                                    ({t('rpg.cheatSheet.dexTierLabel')}:{' '}
                                    {summaryDerived.dexSpeedTier})
                                 </span>
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <section className="rounded-xl border border-border/70 bg-card/50 p-4">
                     <h3 className="text-sm font-bold text-foreground">
                        {t('rpg.abilitiesHeading')}
                     </h3>
                     <ul className="mt-3 space-y-2">
                        {ABILITY_IDS.map((id) => {
                           const raceBonus = creationSnapshot.sheetRacialBonus[id];
                           const drawback = creationSnapshot.sheetDrawback[id];
                           const total = creationSnapshot.totals[id];
                           const warn = creationSnapshot.highTotalFlags[id];
                           return (
                              <li
                                 key={id}
                                 className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2 text-sm"
                              >
                                 <span className="font-semibold text-foreground">
                                    {t(`rpg.abilities.${id}` as 'rpg.title')}
                                 </span>
                                 <span className="font-mono text-xs text-muted-foreground">
                                    {creationSnapshot.scores[id]} {formatBonus(raceBonus)}{' '}
                                    {formatBonus(drawback)} →{' '}
                                    <span
                                       className={clsx(
                                          'text-base font-bold text-foreground',
                                          warn && 'text-amber-600 dark:text-amber-400',
                                       )}
                                    >
                                       {total}
                                    </span>
                                    <span className="ml-2 text-muted-foreground">
                                       (d20 {totalToD20Mod(total) >= 0 ? '+' : ''}
                                       {totalToD20Mod(total)})
                                    </span>
                                 </span>
                              </li>
                           );
                        })}
                     </ul>
                  </section>

                  <section className="rounded-xl border border-border/70 bg-card/50 p-4">
                     <h3 className="text-sm font-bold text-foreground">
                        {t('rpg.cheatSheet.raceSkillsTitle')}
                     </h3>
                     <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        <li>
                           <span className="font-semibold text-foreground">
                              {t('rpg.cheatSheet.attacksHeading')} 1:{' '}
                           </span>
                           {raceSkillName(t, creationSnapshot.selectedRaceId, 'attack1')} —{' '}
                           {raceSkillSummary(t, creationSnapshot.selectedRaceId, 'attack1')}
                        </li>
                        <li>
                           <span className="font-semibold text-foreground">
                              {t('rpg.cheatSheet.attacksHeading')} 2:{' '}
                           </span>
                           {raceSkillName(t, creationSnapshot.selectedRaceId, 'attack2')} —{' '}
                           {raceSkillSummary(t, creationSnapshot.selectedRaceId, 'attack2')}
                        </li>
                        <li>
                           <span className="font-semibold text-foreground">
                              {t('rpg.cheatSheet.supportHeading')}:{' '}
                           </span>
                           {raceSkillName(t, creationSnapshot.selectedRaceId, 'support')} —{' '}
                           {raceSkillSummary(t, creationSnapshot.selectedRaceId, 'support')}
                        </li>
                        <li>
                           <span className="font-semibold text-foreground">
                              {t('rpg.cheatSheet.itemHeading')}:{' '}
                           </span>
                           {raceSkillName(t, creationSnapshot.selectedRaceId, 'item')} —{' '}
                           {raceSkillSummary(t, creationSnapshot.selectedRaceId, 'item')}
                        </li>
                        <li className="border-t border-border/50 pt-2 text-xs">
                           <span className="font-semibold text-foreground">
                              {t('rpg.cheatSheet.outOfCombat')}:{' '}
                           </span>
                           {t(
                              `rpg.races.${creationSnapshot.selectedRaceId}.skills.item.outOfCombat` as 'rpg.title',
                           )}
                        </li>
                     </ul>
                  </section>

                  {creationSnapshot.selectedRaceId === 'humans' ? (
                     <p className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-foreground/90">
                        <span className="font-bold text-primary">
                           {t('rpg.human.playstyleTitle')}:{' '}
                        </span>
                        {t('rpg.human.playstyleSummary')}
                     </p>
                  ) : null}

                  <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-50">
                     <p className="text-xs font-bold uppercase tracking-wide text-amber-900/90 dark:text-amber-200/95">
                        {t('rpg.raceDrawbackMechanical')}
                     </p>
                     <p className="mt-1 font-mono text-xs font-semibold">
                        {mechanicalDrawbackParts(creationSnapshot.sheetDrawback, (key) =>
                           t(key as 'rpg.title'),
                        ).join(' · ') || t('rpg.raceDrawbackNone')}
                     </p>
                  </div>

                  <footer className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                     <button
                        type="button"
                        onClick={closeCreatedSummaryDialog}
                        className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                     >
                        {t('rpg.createdClose')}
                     </button>
                     <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                           type="button"
                           onClick={handleExportFromCreatedSummary}
                           className="rounded-lg border border-primary/60 bg-primary/15 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                           aria-label={t('rpg.createdExportJsonAria')}
                        >
                           {t('rpg.createdExportJson')}
                        </button>
                        <div className="flex flex-col items-stretch gap-1 sm:items-end">
                           <button
                              type="button"
                              onClick={() => {
                                 /* reserved for future session start */
                              }}
                              className="rounded-lg border border-violet-500/50 bg-violet-500/15 px-4 py-2.5 text-sm font-semibold text-violet-900 transition hover:bg-violet-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-violet-100"
                           >
                              {t('rpg.createdStartGame')}
                           </button>
                           <p className="text-center text-[10px] text-muted-foreground sm:text-right">
                              {t('rpg.createdStartGameHint')}
                           </p>
                        </div>
                     </div>
                  </footer>
               </div>
            ) : null}
         </dialog>
      </div>
   );
}
