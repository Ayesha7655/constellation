(function initializeUpworkScraper(global) {
  const config = global.CONSTELLATION_UPWORK_SELECTORS;

  if (!config) {
    throw new Error('Upwork selector configuration was not loaded');
  }

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  const sanitizeUnicode = (value) => {
    let sanitized = '';

    for (let index = 0; index < value.length; index += 1) {
      const codeUnit = value.charCodeAt(index);
      const isHighSurrogate = codeUnit >= 0xd800 && codeUnit <= 0xdbff;
      const isLowSurrogate = codeUnit >= 0xdc00 && codeUnit <= 0xdfff;

      if (isHighSurrogate) {
        const nextCodeUnit = value.charCodeAt(index + 1);
        if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
          sanitized += value[index] + value[index + 1];
          index += 1;
        } else {
          sanitized += '\ufffd';
        }
      } else {
        sanitized += isLowSurrogate ? '\ufffd' : value[index];
      }
    }

    return sanitized;
  };

  const truncateUnicode = (value, maxLength) => {
    const truncated = value.slice(0, maxLength);
    const lastCodeUnit = truncated.charCodeAt(truncated.length - 1);

    return lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff ? truncated.slice(0, -1) : truncated;
  };

  const cleanText = (value, preserveWhitespace = false, maxLength = 5000) => {
    if (typeof value !== 'string') {
      return '';
    }

    const safeValue = sanitizeUnicode(value);
    const normalized = preserveWhitespace
      ? safeValue
          .replace(/\r\n?/g, '\n')
          .split('\n')
          .map((line) => line.replace(/\s+/g, ' ').trim())
          .filter((line, index, lines) => line.length > 0 || (index > 0 && lines[index - 1]?.length > 0))
          .join('\n')
          .trim()
      : safeValue.replace(/\s+/g, ' ').trim();

    return truncateUnicode(normalized, maxLength);
  };

  const absoluteUrl = (value) => {
    if (!value) {
      return '';
    }

    try {
      return new URL(value, window.location.href).toString();
    } catch {
      return value;
    }
  };

  const readElement = (element, definition) => {
    let rawValue = definition.attribute
      ? element.getAttribute(definition.attribute)
      : element.textContent;

    if (rawValue && definition.jsonProperty) {
      try {
        const parsedValue = JSON.parse(rawValue);
        rawValue =
          parsedValue &&
          typeof parsedValue === 'object' &&
          typeof parsedValue[definition.jsonProperty] === 'string'
            ? parsedValue[definition.jsonProperty]
            : '';
      } catch {
        rawValue = '';
      }
    }

    const value = cleanText(rawValue, definition.preserveWhitespace, definition.maxLength);

    if (!value) {
      return '';
    }

    return `${definition.prefix ?? ''}${value}${definition.suffix ?? ''}`;
  };

  const readFirst = (definitions, scope, diagnosticKey, diagnostics) => {
    for (const definition of definitions ?? []) {
      try {
        const element = scope.querySelector(definition.selector);
        if (!element) {
          continue;
        }

        const value = readElement(element, definition);
        if (!value) {
          continue;
        }

        if (diagnosticKey) {
          diagnostics.matches[diagnosticKey] = definition.selector;
        }
        return value;
      } catch (error) {
        diagnostics.invalidSelectors.push({
          field: diagnosticKey,
          selector: definition.selector,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (diagnosticKey) {
      diagnostics.missing.push(diagnosticKey);
    }
    return '';
  };

  const unique = (values) => {
    const seen = new Set();
    const result = [];

    for (const value of values) {
      const key = value.toLocaleLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(value);
      }
    }

    return result;
  };

  const queryFirstNonEmptyList = (listConfig, scope, diagnosticKey, diagnostics) => {
    for (const selector of listConfig.selectors ?? []) {
      try {
        const values = Array.from(scope.querySelectorAll(selector))
          .map((element) => cleanText(element.textContent, false, listConfig.maxItemLength ?? 200))
          .filter(Boolean)
          .filter((value) => !(listConfig.reject ?? []).some((pattern) => pattern.test(value)));
        const deduplicated = unique(values).slice(0, listConfig.maxItems ?? 100);

        if (deduplicated.length > 0) {
          diagnostics.matches[diagnosticKey] = selector;
          diagnostics.counts[diagnosticKey] = deduplicated.length;
          return deduplicated;
        }
      } catch (error) {
        diagnostics.invalidSelectors.push({
          field: diagnosticKey,
          selector,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    diagnostics.missing.push(diagnosticKey);
    diagnostics.counts[diagnosticKey] = 0;
    return [];
  };

  const queryFirstNonEmptyItems = (selectors, scope, diagnosticKey, diagnostics) => {
    for (const selector of selectors ?? []) {
      try {
        const elements = Array.from(scope.querySelectorAll(selector));
        if (elements.length > 0) {
          diagnostics.matches[diagnosticKey] = selector;
          return elements;
        }
      } catch (error) {
        diagnostics.invalidSelectors.push({
          field: diagnosticKey,
          selector,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return [];
  };

  const readMetrics = (diagnostics) => {
    const elements = queryFirstNonEmptyItems(config.metrics.itemSelectors, document, 'metrics', diagnostics);
    const metrics = {};

    for (const element of elements.slice(0, config.metrics.maxItems ?? 20)) {
      const label = readFirst(config.metrics.label, element, '', diagnostics);
      const value = readFirst(config.metrics.value, element, '', diagnostics);
      if (label && value) {
        metrics[label] = value;
      }
    }

    diagnostics.counts.metrics = Object.keys(metrics).length;
    return metrics;
  };

  const readCards = (cardName, cardConfig, diagnostics) => {
    const diagnosticKey = `cards.${cardName}`;
    const elements = queryFirstNonEmptyItems(cardConfig.itemSelectors, document, diagnosticKey, diagnostics);
    const cards = [];

    for (const element of elements.slice(0, cardConfig.maxItems ?? 100)) {
      const card = {};

      for (const [fieldName, definitions] of Object.entries(cardConfig.fields ?? {})) {
        const value = readFirst(definitions, element, '', diagnostics);
        if (value) {
          card[fieldName] = fieldName.toLocaleLowerCase().includes('url') ? absoluteUrl(value) : value;
        }
      }

      for (const [listName, listConfig] of Object.entries(cardConfig.lists ?? {})) {
        const values = queryFirstNonEmptyList(listConfig, element, `${diagnosticKey}.${listName}`, diagnostics);
        if (values.length > 0) {
          card[listName] = values;
        }
      }

      if (Object.keys(card).length > 0) {
        cards.push(card);
      }
    }

    diagnostics.counts[diagnosticKey] = cards.length;
    if (cards.length === 0) {
      diagnostics.missing.push(diagnosticKey);
    }
    return cards;
  };

  const waitForProfile = async (timeoutMs = 4000) => {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      if (config.profileReady.some((selector) => document.querySelector(selector))) {
        return;
      }
      await wait(100);
    }
  };

  const expandProfileContent = async () => {
    let clicked = 0;

    for (const selector of config.expandBeforeScrape ?? []) {
      const buttons = Array.from(document.querySelectorAll(selector));
      for (const button of buttons) {
        if (button instanceof HTMLElement) {
          button.click();
          clicked += 1;
        }
      }
    }

    if (clicked > 0) {
      await wait(350);
    }

    return clicked;
  };

  const parseNumber = (value) => {
    const match = value.match(/-?\d+(?:[,.]\d+)?/);
    if (!match) {
      return null;
    }

    const parsed = Number(match[0].replace(',', ''));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const parseHourlyRate = (value) => {
    const match = value.match(/(?:[$€£]\s*)?(\d+(?:[,.]\d+)?)\s*(?:\/\s*hr|per\s+hour)?/i);
    if (!match?.[1]) {
      return null;
    }

    const parsed = Number(match[1].replace(',', ''));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeCountry = (value) => {
    const parts = value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.at(-1) ?? value;
  };

  const scrapeProfile = async () => {
    await waitForProfile();
    const expandedElements = await expandProfileContent();
    const diagnostics = {
      selectorVersion: config.version,
      matches: {},
      counts: {},
      missing: [],
      invalidSelectors: [],
      expandedElements,
    };
    const fields = {};

    for (const [fieldName, definitions] of Object.entries(config.fields)) {
      fields[fieldName] = readFirst(definitions, document, fieldName, diagnostics);
    }

    const lists = {};
    for (const [listName, listConfig] of Object.entries(config.lists)) {
      lists[listName] = queryFirstNonEmptyList(listConfig, document, listName, diagnostics);
    }

    const cards = {};
    for (const [cardName, cardConfig] of Object.entries(config.cards)) {
      cards[cardName] = readCards(cardName, cardConfig, diagnostics);
    }

    const metrics = readMetrics(diagnostics);
    const hourlyRate = parseHourlyRate(fields.hourlyRate);
    const roundedHourlyRate = hourlyRate === null ? null : Math.round(hourlyRate);
    const rating = parseNumber(fields.rating);
    const reviewCount = parseNumber(fields.reviewCount);
    const profileUrl = fields.profileUrl ? absoluteUrl(fields.profileUrl) : window.location.href;
    const city = fields.city || null;
    const country = fields.country ? normalizeCountry(fields.country) : null;
    const scrapedAt = new Date().toISOString();
    const viewMode = document.querySelector('[data-internal-app="user"]') ? 'owner' : 'visitor';

    return {
      title: fields.title || document.title.split(' - ')[1]?.trim() || null,
      overview: fields.overview || null,
      hourlyRateMin: roundedHourlyRate,
      hourlyRateMax: roundedHourlyRate,
      country,
      timezone: fields.timezone || null,
      skills: lists.skills,
      languages: lists.languages,
      exclusions: [],
      profileUrl,
      rawSnapshot: {
        source: 'upwork-dom',
        viewMode,
        selectorVersion: config.version,
        profile: {
          uid: fields.profileUid || null,
          url: profileUrl,
          name: fields.name || null,
          title: fields.title || null,
          overview: fields.overview || null,
          overviewMayBeTruncated: fields.overview ? /…|\.\.\.$/.test(fields.overview) : false,
          hourlyRate,
          city,
          country,
          timezone: fields.timezone || null,
          localTime: fields.localTime || null,
          photoUrl: fields.photoUrl ? absoluteUrl(fields.photoUrl) : null,
          availabilityStatus: fields.availabilityStatus.replace(/^Status:\s*/i, '') || null,
          availabilityHours: fields.availabilityHours || null,
          availabilityBadge: fields.availabilityBadge || null,
          contractToHire: fields.contractToHire || null,
          responseTime: fields.responseTime || null,
          introductionVideoUrl: fields.introductionVideoUrl
            ? absoluteUrl(fields.introductionVideoUrl)
            : null,
          identityVerified: /^verified$/i.test(fields.identityVerified),
          rating,
          reviewCount,
          specializedProfiles: lists.specializedProfiles,
          metrics,
          skills: lists.skills,
          languages: lists.languages,
        },
        workHistory: cards.workHistory,
        portfolio: cards.portfolio,
        clientFeedback: cards.clientFeedback,
        education: cards.education,
        employment: cards.employment,
        certifications: cards.certifications,
        projectCatalog: cards.projectCatalog,
        linkedAccounts: cards.linkedAccounts,
        extraction: diagnostics,
        scrapedAt,
      },
    };
  };

  global.CONSTELLATION_UPWORK_SCRAPER = {
    scrapeProfile,
  };
})(globalThis);
