'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/cn';
import { testsResponseSchema, testSchema, taxonomyResponseSchema, type TestDto } from '@/lib/validation/tests';
import styles from './test-form.module.css';

type MultiSelectOption = { label: string; value: string };

type MultiSelectCopy = {
  placeholder: string;
  dialogLabel: string;
  dialogTitle: string;
  dialogHelper: string;
  searchPlaceholder: string;
  searchAria: string;
  clear: string;
  emptySelection: string;
  emptyResults: string;
  remove: string;
  add: string;
};

type MultiSelectProps = {
  id: string;
  label: string;
  description?: string;
  placeholder?: string;
  options: MultiSelectOption[];
  values: string[];
  copy: MultiSelectCopy;
  onChange: (values: string[]) => void;
};

type PopupPosition = { top: number; left: number; width: number } | null;

function MultiSelect({ id, label, description, placeholder, options, values, copy, onChange }: MultiSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState<PopupPosition>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.label.toLowerCase().includes(term));
  }, [options, query]);

  const selectedOptions = useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values],
  );

  const optionLabelMap = useMemo(
    () => new Map(options.map((option) => [option.value, option.label])),
    [options],
  );

  function toggleValue(value: string) {
    const hasValue = values.includes(value);
    const next = hasValue ? values.filter((item) => item !== value) : [...values, value];
    onChange(next);
  }

  function closePopup() {
    setIsOpen(false);
  }

  function updatePopupPosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportWidth = window.innerWidth;

    const popupWidth = Math.min(Math.max(rect.width, 320), Math.min(520, viewportWidth - 24));
    const maxLeft = viewportWidth - popupWidth - 12;
    const left = Math.min(Math.max(12, rect.left), Math.max(12, maxLeft));

    const top = Math.min(rect.bottom + 8, window.innerHeight - 16);

    setPopupPosition({
      top,
      left,
      width: popupWidth,
    });
  }

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    updatePopupPosition();
    const handleResize = () => updatePopupPosition();
    const handleScroll = () => updatePopupPosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isOpen) return;
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (overlayRef.current?.contains(target)) return;
      closePopup();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePopup();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={styles.multiSelectWrapper} ref={wrapperRef}>
      <div className={styles.multiSelectHeader}>
        <Label htmlFor={id}>{label}</Label>
        {description ? <p className="helper-text">{description}</p> : null}
      </div>
      <button
        type="button"
        id={id}
        className={cn(styles.multiSelectControl, isOpen && styles.multiSelectOpen)}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        ref={triggerRef}
      >
        <div className={styles.multiSelectTokens}>
          {values.length === 0 ? (
            <span className="text-subtle">{placeholder ?? copy.placeholder}</span>
          ) : (
            values.map((value) => (
              <Badge
                key={value}
                variant="secondary"
                className={styles.token}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleValue(value);
                }}
              >
                {optionLabelMap.get(value) ?? value}
                <span aria-hidden>×</span>
              </Badge>
            ))
          )}
        </div>
        <span className={styles.chevron} aria-hidden>
          {isOpen ? '▴' : '▾'}
        </span>
      </button>

      {isOpen ? (
        <div className={styles.popupLayer}>
          <div className={styles.popupBackdrop} aria-hidden onClick={closePopup} />
          <div
            className={styles.popup}
            ref={overlayRef}
            style={popupPosition ? { top: popupPosition.top, left: popupPosition.left, width: popupPosition.width } : undefined}
            role="dialog"
            aria-modal="true"
            aria-label={copy.dialogLabel}
          >
            <div className={styles.popupHeader}>
              <div className={styles.popupTitle}>{copy.dialogTitle}</div>
              <p className="helper-text">{copy.dialogHelper}</p>
            </div>

            <div className={styles.searchBar}>
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder ?? copy.searchPlaceholder}
                aria-label={copy.searchAria}
              />
              {query ? (
                <Button variant="ghost" size="sm" type="button" onClick={() => setQuery('')}>
                  {copy.clear}
                </Button>
              ) : null}
            </div>

            <div className={styles.selectedBadges}>
              {selectedOptions.length === 0 ? (
                <p className="helper-text">{copy.emptySelection}</p>
              ) : (
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="outline"
                    className={styles.selectedToken}
                    onClick={() => toggleValue(option.value)}
                  >
                    {option.label}
                    <span aria-hidden>×</span>
                  </Badge>
                ))
              )}
            </div>

            <div className={styles.optionsList}>
              {filtered.length === 0 ? (
                <p className={styles.emptyState}>{copy.emptyResults}</p>
              ) : (
                filtered.map((option) => {
                  const active = values.includes(option.value);
                  return (
                    <button
                      type="button"
                      key={option.value}
                      className={cn(styles.optionItem, active && styles.optionItemActive)}
                      onClick={() => toggleValue(option.value)}
                    >
                      <span className={styles.optionLabel}>{option.label}</span>
                      <span className={styles.optionBadge}>{active ? copy.remove : copy.add}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const formSchemaBase = testSchema
  .omit({ id: true, slug: true, createdAt: true, updatedAt: true })
  .extend({
    id: z.string().uuid().optional(),
    shortDescription: z.string().nullable().optional(),
    objective: z.string().nullable().optional(),
    population: z.string().nullable().optional(),
    materials: z.string().nullable().optional(),
    publisher: z.string().nullable().optional(),
    priceRange: z.string().nullable().optional(),
    buyLink: z.string().url().nullable().optional(),
    notes: z.string().nullable().optional(),
    ageMinMonths: z.number().int().nullable().optional(),
    ageMaxMonths: z.number().int().nullable().optional(),
    durationMinutes: z.number().int().nullable().optional(),
    bibliography: z
      .array(
        z.object({
          label: z.string().min(1),
          url: z.string().url(),
        }),
      )
      .default([])
      .optional(),
  });

type FormValues = z.infer<typeof formSchemaBase>;

type ApiResponse = {
  test?: TestDto;
  tests?: TestDto[];
  error?: string;
};

const defaultValues: FormValues = {
  id: undefined,
  name: '',
  shortDescription: null,
  objective: null,
  ageMinMonths: null,
  ageMaxMonths: null,
  population: null,
  durationMinutes: null,
  materials: null,
  isStandardized: true,
  publisher: null,
  priceRange: null,
  buyLink: null,
  notes: null,
  domains: [],
  tags: [],
  bibliography: [],
};

async function fetchTests(errorMessage: string) {
  const response = await fetch('/api/tests');

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  const json = (await response.json()) as ApiResponse;
  const parsed = testsResponseSchema.parse({ tests: json.tests ?? [] });
  return parsed.tests;
}

async function fetchTaxonomy(errorMessage: string) {
  const response = await fetch('/api/tests/taxonomy');

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  const json = await response.json();
  return taxonomyResponseSchema.parse(json);
}

async function createTest(payload: FormValues, fallbackMessage: string) {
  const response = await fetch('/api/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as ApiResponse;
    throw new Error(json.error ?? fallbackMessage);
  }

  return (await response.json()) as ApiResponse;
}

async function updateTest(payload: FormValues, fallbackMessage: string) {
  const response = await fetch('/api/tests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as ApiResponse;
    throw new Error(json.error ?? fallbackMessage);
  }

  return (await response.json()) as ApiResponse;
}

function TestForm() {
  const t = useTranslations('TestsForm');
  const queryClient = useQueryClient();

  const numberMessage = t('validation.number');
  const urlMessage = t('validation.url');

const numericNullableInt = z
  .number({ error: numberMessage })
  .refine((value) => Number.isFinite(value), { error: numberMessage })
  .int({ error: numberMessage })
  .nullable()
  .optional();

const formSchema = useMemo(
  () =>
    formSchemaBase.extend({
      id: z.string().uuid().optional(),
      name: z.string().min(1, { message: t('validation.nameRequired') }),

      shortDescription: z.string().nullable().optional(),
      objective: z.string().nullable().optional(),

      ageMinMonths: numericNullableInt,
      ageMaxMonths: numericNullableInt,
      durationMinutes: numericNullableInt,

      population: z.string().nullable().optional(),
      materials: z.string().nullable().optional(),
      isStandardized: z.boolean(),
      publisher: z.string().nullable().optional(),
      priceRange: z.string().nullable().optional(),

      buyLink: z
        .string({ error: urlMessage })
        .url({ message: urlMessage })
        .nullable()
        .optional(),

      notes: z.string().nullable().optional(),

      domains: z.array(z.string()),
      tags: z.array(z.string()),

      bibliography: z
        .array(
          z.object({
            label: z.string().min(1, {
              message: t('validation.bibliographyLabel'),
            }),
            url: z.string({ error: urlMessage }).url({
              message: urlMessage,
            }),
          }),
        )
        .default([])
        .optional(),
    }),
  [numberMessage, urlMessage, t],
);


  const taxonomyQueryFn = useCallback(() => fetchTaxonomy(t('states.loadTaxonomyError')), [t]);
  const testsQueryFn = useCallback(() => fetchTests(t('states.loadTestsError')), [t]);

  const { data: taxonomy } = useQuery({ queryKey: ['test-taxonomy'], queryFn: taxonomyQueryFn });
  const { data: tests } = useQuery({ queryKey: ['tests'], queryFn: testsQueryFn });
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [newBibliography, setNewBibliography] = useState({ label: '', url: '' });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const currentDomains = watch('domains');
  const currentTags = watch('tags');
  const currentBibliography = watch('bibliography');
  const populationValue = watch('population');
  const materialsValue = watch('materials');

  const multiSelectBaseCopy = useMemo<Omit<MultiSelectCopy, 'dialogLabel' | 'dialogTitle' | 'searchAria'>>(
    () => ({
      placeholder: t('multiSelect.placeholder'),
      dialogHelper: t('multiSelect.dialogHelper'),
      searchPlaceholder: t('multiSelect.searchPlaceholder'),
      clear: t('multiSelect.clear'),
      emptySelection: t('multiSelect.emptySelection'),
      emptyResults: t('multiSelect.emptyResults'),
      remove: t('multiSelect.remove'),
      add: t('multiSelect.add'),
    }),
    [t],
  );

  const domainCopy = useMemo<MultiSelectCopy>(
    () => ({
      ...multiSelectBaseCopy,
      dialogLabel: t('multiSelect.dialogLabel', { label: t('sections.taxonomy.domainsLabel') }),
      dialogTitle: t('multiSelect.dialogTitle', { label: t('sections.taxonomy.domainsLabel') }),
      searchAria: t('multiSelect.searchAria', { label: t('sections.taxonomy.domainsLabel') }),
    }),
    [multiSelectBaseCopy, t],
  );

  const tagCopy = useMemo<MultiSelectCopy>(
    () => ({
      ...multiSelectBaseCopy,
      dialogLabel: t('multiSelect.dialogLabel', { label: t('sections.taxonomy.tagsLabel') }),
      dialogTitle: t('multiSelect.dialogTitle', { label: t('sections.taxonomy.tagsLabel') }),
      searchAria: t('multiSelect.searchAria', { label: t('sections.taxonomy.tagsLabel') }),
    }),
    [multiSelectBaseCopy, t],
  );

  useEffect(() => {
    if (!selectedTestId) {
      reset(defaultValues);
      setNewBibliography({ label: '', url: '' });
      return;
    }

    const test = (tests ?? []).find((item) => item.id === selectedTestId);

    if (test) {
      reset({
        id: test.id,
        name: test.name,
        shortDescription: test.shortDescription,
        objective: test.objective,
        ageMinMonths: test.ageMinMonths,
        ageMaxMonths: test.ageMaxMonths,
        population: test.population,
        durationMinutes: test.durationMinutes,
        materials: test.materials,
        isStandardized: test.isStandardized,
        publisher: test.publisher,
        priceRange: test.priceRange,
        buyLink: test.buyLink,
        notes: test.notes,
        domains: test.domains,
        tags: test.tags,
        bibliography: test.bibliography ?? [],
      });
      setNewBibliography({ label: '', url: '' });
    }
  }, [reset, selectedTestId, tests]);

  const createMutation = useMutation({
    mutationFn: (payload: FormValues) => createTest(payload, t('states.createError')),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      void queryClient.invalidateQueries({ queryKey: ['test-taxonomy'] });
      reset(defaultValues);
      setSelectedTestId(null);
      setNewBibliography({ label: '', url: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: FormValues) => updateTest(payload, t('states.updateError')),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
      void queryClient.invalidateQueries({ queryKey: ['test-taxonomy'] });
    },
  });

  const [submitLabel, submitDisabled] = useMemo(() => {
    const pending = createMutation.isPending || updateMutation.isPending;
    const label = pending
      ? t('toolbar.submit.saving')
      : selectedTestId
        ? t('toolbar.submit.update')
        : t('toolbar.submit.create');
    return [label, pending];
  }, [createMutation.isPending, selectedTestId, t, updateMutation.isPending]);

  const onSubmit = handleSubmit((values) => {
    const payload: FormValues = {
      ...values,
      name: values.name.trim(),
      shortDescription: values.shortDescription?.trim() || null,
      objective: values.objective?.trim() || null,
      population: values.population?.trim() || null,
      materials: values.materials?.trim() || null,
      publisher: values.publisher?.trim() || null,
      priceRange: values.priceRange?.trim() || null,
      buyLink: values.buyLink?.trim() || null,
      notes: values.notes?.trim() || null,
      ageMinMonths: values.ageMinMonths ?? null,
      ageMaxMonths: values.ageMaxMonths ?? null,
      durationMinutes: values.durationMinutes ?? null,
      domains: Array.from(new Set((values.domains ?? []).map((domain) => domain.trim()).filter(Boolean))),
      tags: Array.from(new Set((values.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
      bibliography: (values.bibliography ?? [])
        .map((entry) => ({
          label: entry.label.trim(),
          url: entry.url.trim(),
        }))
        .filter((entry) => entry.label && entry.url),
    };

    if (payload.id) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  });

  function updateBibliographyItem(
    index: number,
    field: 'label' | 'url',
    value: string,
  ) {
    const entries = [...(currentBibliography ?? [])];
    const next = entries.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry,
    );
    setValue('bibliography', next, { shouldDirty: true });
  }

  function removeBibliographyItem(index: number) {
    const entries = [...(currentBibliography ?? [])];
    entries.splice(index, 1);
    setValue('bibliography', entries, { shouldDirty: true });
  }

  function addBibliographyItem() {
    const label = newBibliography.label.trim();
    const url = newBibliography.url.trim();

    if (!label || !url) {
      return;
    }

    const entries = [...(currentBibliography ?? []), { label, url }];
    setValue('bibliography', entries, { shouldDirty: true });
    setNewBibliography({ label: '', url: '' });
  }

  return (
  <form className="notion-form" onSubmit={(event) => void onSubmit(event)}>
    <div className="notion-toolbar">
      <div className="notion-toolbar__group">
        <Label htmlFor="test-selector">{t('toolbar.sheetLabel')}</Label>
        <Select
          id="test-selector"
          value={selectedTestId ?? ''}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedTestId(event.target.value || null)}
          aria-label={t('toolbar.selectorAria')}
        >
          <option value="">{t('toolbar.selectorPlaceholder')}</option>
          {(tests ?? []).map((test) => (
            <option key={test.id} value={test.id}>
              {test.name}
            </option>
          ))}
        </Select>
        {selectedTestId ? <Badge variant="outline">{t('toolbar.editBadge')}</Badge> : <Badge>{t('toolbar.newBadge')}</Badge>}
      </div>

      <div className="notion-toolbar__group">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            reset(defaultValues);
            setSelectedTestId(null);
            setNewBibliography({ label: '', url: '' });
          }}
        >
          {t('toolbar.reset')}
        </Button>
        <Button type="submit" disabled={submitDisabled} aria-busy={submitDisabled}>
          {submitLabel}
        </Button>
      </div>
    </div>

    <Input
      id="name"
      className="notion-title-input"
      placeholder={t('fields.name.placeholder')}
      aria-label={t('fields.name.aria')}
      {...register('name')}
    />
    {errors.name && <p className="error-text">{errors.name.message}</p>}

    {/* 1. Résumé détaillé + 2. Bibliographie + Infos complémentaires */}
    <div className="content-grid">
      {/* Résumé détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.summary.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="property-value">
            <Label htmlFor="shortDescription">{t('sections.summary.descriptionLabel')}</Label>
            <Textarea
              id="shortDescription"
              placeholder={t('fields.shortDescription.placeholder')}
              {...register('shortDescription', { setValueAs: (value) => (value === '' ? null : value) })}
            />
          </div>
          <Separator />
          <div className="property-value">
            <Label htmlFor="objective">{t('sections.summary.objectiveLabel')}</Label>
            <Textarea
              id="objective"
              placeholder={t('fields.objective.placeholder')}
              {...register('objective', { setValueAs: (value) => (value === '' ? null : value) })}
            />
          </div>
          <Separator />
          <div className="property-value">
            <Label htmlFor="notes">{t('sections.summary.notesLabel')}</Label>
            <Textarea
              id="notes"
              placeholder={t('fields.notes.placeholder')}
              {...register('notes', { setValueAs: (value) => (value === '' ? null : value) })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bibliographie (2ème bloc) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.bibliography.title')}</CardTitle>
          <p className="helper-text">{t('sections.bibliography.helper')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {(currentBibliography ?? []).length === 0 && (
              <p className={`helper-text ${styles.helperTight}`}>
                {t('sections.bibliography.empty')}
              </p>
            )}

            {(currentBibliography ?? []).map((entry, index) => (
              <div key={`${entry.label}-${index}`} className={`property-value ${styles.bibliographyEntry}`}>
                <Label htmlFor={`bibliography-label-${index}`}>{t('sections.bibliography.entryTitleLabel')}</Label>
                <Input
                  id={`bibliography-label-${index}`}
                  value={entry.label}
                  onChange={(event) => updateBibliographyItem(index, 'label', event.target.value)}
                  placeholder={t('sections.bibliography.entryTitlePlaceholder')}
                />
                {errors.bibliography?.[index]?.label && (
                  <p className="error-text">{errors.bibliography?.[index]?.label?.message}</p>
                )}

                <Label htmlFor={`bibliography-url-${index}`}>{t('sections.bibliography.entryUrlLabel')}</Label>
                <div className="notion-toolbar__group">
                  <Input
                    id={`bibliography-url-${index}`}
                    type="url"
                    value={entry.url}
                    onChange={(event) => updateBibliographyItem(index, 'url', event.target.value)}
                    placeholder={t('sections.bibliography.entryUrlPlaceholder')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBibliographyItem(index)}
                  >
                    {t('sections.bibliography.removeEntry')}
                  </Button>
                </div>
                {errors.bibliography?.[index]?.url && (
                  <p className="error-text">{errors.bibliography?.[index]?.url?.message}</p>
                )}
                <Separator />
              </div>
            ))}
          </div>

          <div className={`property-value ${styles.bibliographyCreate}`}>
            <Label htmlFor="bibliography-new-label">{t('sections.bibliography.addReferenceLabel')}</Label>
            <Input
              id="bibliography-new-label"
              placeholder={t('sections.bibliography.newEntryTitlePlaceholder')}
              value={newBibliography.label}
              onChange={(event) => setNewBibliography((prev) => ({ ...prev, label: event.target.value }))}
            />
            <div className="notion-toolbar__group">
              <Input
                id="bibliography-new-url"
                type="url"
                placeholder={t('sections.bibliography.newEntryUrlPlaceholder')}
                value={newBibliography.url}
                onChange={(event) => setNewBibliography((prev) => ({ ...prev, url: event.target.value }))}
              />
              <Button type="button" variant="outline" size="sm" onClick={addBibliographyItem}>
                {t('sections.bibliography.addButton')}
              </Button>
            </div>
            <p className={`helper-text ${styles.helperTight}`}>
              {t('sections.bibliography.addHelper')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informations complémentaires (3e carte dans la grid, mais avant Propriétés) */}
      <Card>
        <CardHeader>
          <CardTitle>{t('sections.additionalInfo.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="property-value">
            <Label htmlFor="population-secondary">{t('sections.additionalInfo.populationLabel')}</Label>
            <Input
              id="population-secondary"
              placeholder={t('sections.additionalInfo.populationPlaceholder')}
              value={populationValue ?? ''}
              onChange={(event) =>
                setValue('population', event.target.value === '' ? null : event.target.value, { shouldDirty: true })
              }
            />
          </div>
          <Separator />
          <div className="property-value">
            <Label htmlFor="materials-secondary">{t('sections.additionalInfo.materialsLabel')}</Label>
            <Textarea
              id="materials-secondary"
              placeholder={t('sections.additionalInfo.materialsPlaceholder')}
              value={materialsValue ?? ''}
              onChange={(event) =>
                setValue('materials', event.target.value === '' ? null : event.target.value, { shouldDirty: true })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* 3. Propriétés (déplacé après le contenu détaillé + biblio) */}
    <Card className="property-panel">
  <CardHeader>
    <CardTitle>{t('sections.properties.title')}</CardTitle>
    <p className="helper-text">{t('sections.properties.helper')}</p>
  </CardHeader>

  <CardContent className={styles.propertySections}>

    {/* --- Ciblage & durée --- */}
    <div className={styles.sectionBlock}>
      <p className={styles.sectionTitle}>{t('sections.properties.targetingTitle')}</p>
      <div className="property-grid">

        {/* Âge (mois) */}
        <div className="property-row">
          <div className="property-label">{t('sections.properties.ageLabel')}</div>
          <div className="property-value">
            <div className={styles.ageGrid}>
              <Input
                id="ageMinMonths"
                type="number"
                placeholder={t('fields.ageMin.placeholder')}
                aria-label={t('fields.ageMin.aria')}
                {...register('ageMinMonths', {
                  setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                })}
              />
              <Input
                id="ageMaxMonths"
                type="number"
                placeholder={t('fields.ageMax.placeholder')}
                aria-label={t('fields.ageMax.aria')}
                {...register('ageMaxMonths', {
                  setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                })}
              />
            </div>

            {(errors.ageMinMonths || errors.ageMaxMonths) && (
              <p className="error-text">
                {errors.ageMinMonths?.message || errors.ageMaxMonths?.message}
              </p>
            )}
          </div>
        </div>

        {/* Durée */}
        <div className="property-row">
          <div className="property-label">{t('sections.properties.durationLabel')}</div>
          <div className="property-value">
            <Input
              id="durationMinutes"
              type="number"
              placeholder={t('fields.duration.placeholder')}
              aria-label={t('fields.duration.aria')}
              {...register('durationMinutes', {
                setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
              })}
            />
            {errors.durationMinutes && (
              <p className="error-text">{errors.durationMinutes.message}</p>
            )}
            <p className="helper-text">{t('sections.properties.durationHelper')}</p>
          </div>
        </div>

        {/* Population */}
        <div className="property-row">
          <div className="property-label">{t('sections.properties.populationLabel')}</div>
          <div className="property-value">
            <Input
              id="population"
              placeholder={t('fields.population.placeholder')}
              aria-label={t('fields.population.aria')}
              {...register('population', {
                setValueAs: (value) => (value === '' ? null : value),
              })}
            />
          </div>
        </div>

      </div>
    </div>

    {/* --- Édition & accès --- */}
    <div className={styles.sectionBlock}>
      <p className={styles.sectionTitle}>{t('sections.edition.title')}</p>
      <div className="property-grid">

        {/* Éditeur */}
        <div className="property-row">
          <div className="property-label">{t('sections.edition.publisherLabel')}</div>
          <div className="property-value">
            <Input
              id="publisher"
              placeholder={t('fields.publisher.placeholder')}
              aria-label={t('fields.publisher.aria')}
              {...register('publisher', {
                setValueAs: (value) => (value === '' ? null : value),
              })}
            />
            <Input
              id="priceRange"
              placeholder={t('fields.priceRange.placeholder')}
              aria-label={t('fields.priceRange.aria')}
              {...register('priceRange', {
                setValueAs: (value) => (value === '' ? null : value),
              })}
            />
          </div>
        </div>

        {/* Achat */}
        <div className="property-row">
          <div className="property-label">{t('sections.edition.purchaseLabel')}</div>
          <div className="property-value">
            <Input
              id="buyLink"
              placeholder={t('fields.buyLink.placeholder')}
              aria-label={t('fields.buyLink.aria')}
              {...register('buyLink', {
                setValueAs: (value) => (value === '' ? null : value),
              })}
            />
            {errors.buyLink && (
              <p className="error-text">{errors.buyLink.message}</p>
            )}
            <Input
              id="materials"
              placeholder={t('fields.materials.placeholder')}
              aria-label={t('fields.materials.aria')}
              {...register('materials', {
                setValueAs: (value) => (value === '' ? null : value),
              })}
            />
          </div>
        </div>

        {/* Standardisation */}
        <div className="property-row">
          <div className="property-label">{t('sections.edition.standardizationLabel')}</div>
          <div className="property-value">
            <label
              className={cn(
                'pill-toggle',
                watch('isStandardized') && 'is-active'
              )}
            >
              <input
                type="checkbox"
                {...register('isStandardized')}
                className={styles.hiddenInput}
                aria-label={t('fields.isStandardized.aria')}
              />
              {watch('isStandardized') ? t('fields.isStandardized.standardized') : t('fields.isStandardized.nonStandardized')}
            </label>
            <p className="helper-text">{t('sections.edition.standardizationHelper')}</p>
          </div>
        </div>

      </div>
    </div>

    {/* --- Taxonomie --- */}
    <div className={styles.sectionBlock}>
      <p className={styles.sectionTitle}>{t('sections.taxonomy.title')}</p>
      <div className="property-grid">

        {/* Domaines */}
        <div className="property-row">
          <div className="property-label">{t('sections.taxonomy.domainsLabel')}</div>
          <div className="property-value">
            <MultiSelect
              id="domains"
              label={t('sections.taxonomy.domainsLabel')}
              description={t('sections.taxonomy.domainsHelper')}
              placeholder={t('sections.taxonomy.domainsPlaceholder')}
              options={(taxonomy?.domains ?? []).map((domain) => ({
                label: domain.label,
                value: domain.label,
              }))}
              values={currentDomains ?? []}
              copy={domainCopy}
              onChange={(values) =>
                setValue('domains', values, { shouldDirty: true })
              }
            />
          </div>
        </div>

        {/* Tags */}
        <div className="property-row">
          <div className="property-label">{t('sections.taxonomy.tagsLabel')}</div>
          <div className="property-value">
            <MultiSelect
              id="tags"
              label={t('sections.taxonomy.tagsLabel')}
              description={t('sections.taxonomy.tagsHelper')}
              placeholder={t('sections.taxonomy.tagsPlaceholder')}
              options={(taxonomy?.tags ?? []).map((tag) => ({
                label: tag.label,
                value: tag.label,
              }))}
              values={currentTags ?? []}
              copy={tagCopy}
              onChange={(values) =>
                setValue('tags', values, { shouldDirty: true })
              }
            />
          </div>
        </div>

      </div>
    </div>

  </CardContent>
</Card>

    {(createMutation.isError || updateMutation.isError) && (
      <p className={`error-text ${styles.flushError}`}>
        {createMutation.error?.message || updateMutation.error?.message || t('states.genericError')}
      </p>
    )}

    {(createMutation.isSuccess || updateMutation.isSuccess) && !createMutation.isError && !updateMutation.isError && (
      <p className={styles.successMessage}>
        {t('states.success')}
      </p>
    )}
  </form>
);
}

export default TestForm;
