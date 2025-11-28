import { defaultLocale, type Locale } from '@/i18n/routing';
import { getResourcesWithMetadata } from '@/lib/resources/queries';
import { getTestsWithMetadata } from '@/lib/tests/queries';
import { searchLocaleSchema } from '@/lib/validation/search';
import type { ResourceSearchResult, SearchGroup, SearchHubProps, TestSearchResult } from './types';

const selfReportKeywords = ['self', 'auto', 'auto-évaluation'];

function normalizeArray(values: string[]) {
  return values.filter((value) => value && value.trim().length > 0);
}

function inferTestCategory(tags: string[]) {
  const lowerTags = tags.map((tag) => tag.toLowerCase());

  if (lowerTags.some((tag) => selfReportKeywords.some((keyword) => tag.includes(keyword)))) {
    return 'selfReports' as const;
  }

  return 'assessments' as const;
}

function mapTestToResult(test: Awaited<ReturnType<typeof getTestsWithMetadata>>[number]): TestSearchResult {
  const category = inferTestCategory(test.tags);

  return {
    id: test.id,
    title: test.name,
    description: test.shortDescription,
    tags: normalizeArray(test.tags),
    domains: normalizeArray(test.domains),
    pathologies: normalizeArray(test.pathologies),
    category,
    kind: 'test',
    slug: test.slug,
    population: test.population,
    materials: test.materials,
    durationMinutes: test.durationMinutes,
    isStandardized: test.isStandardized,
    objective: test.objective,
  };
}

function mapResourceToResult(resource: Awaited<ReturnType<typeof getResourcesWithMetadata>>[number]): ResourceSearchResult {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    tags: normalizeArray(resource.tags),
    domains: normalizeArray(resource.domains),
    pathologies: normalizeArray(resource.pathologies),
    category: 'resources',
    kind: 'resource',
    resourceType: resource.type,
    url: resource.url,
  };
}

function sortByTitle<T extends { title: string }>(a: T, b: T) {
  return a.title.localeCompare(b.title);
}

function collectDomains(groups: SearchGroup[]) {
  const domainSet = new Set<string>();

  groups.forEach((group) => {
    group.results.forEach((result) => {
      result.domains.forEach((domain) => domainSet.add(domain));
    });
  });

  return Array.from(domainSet).sort();
}

export async function getSearchHubData(locale: Locale = defaultLocale): Promise<SearchHubProps> {
  const parsedLocale = searchLocaleSchema.parse(locale);

  const [tests, resources] = await Promise.all([
    getTestsWithMetadata(parsedLocale),
    getResourcesWithMetadata(parsedLocale),
  ]);

  const testResults = tests.map(mapTestToResult).sort(sortByTitle);
  const resourceResults = resources.map(mapResourceToResult).sort(sortByTitle);

  const assessments = testResults.filter((result) => result.category === 'assessments');
  const selfReports = testResults.filter((result) => result.category === 'selfReports');

  const groups: SearchGroup[] = [
    { category: 'assessments', results: assessments },
    { category: 'selfReports', results: selfReports },
    { category: 'resources', results: resourceResults },
  ];

  return {
    groups,
    domains: collectDomains(groups),
  };
}
