/**
 * Ordered Upwork profile selector configuration.
 *
 * Put the most stable selector first. The extractor tries each selector in
 * order and stops at the first non-empty result. Keep selectors scoped to the
 * profile container so navigation, footer, portfolio, and work-history skills
 * cannot leak into the main profile fields.
 */
globalThis.CONSTELLATION_UPWORK_SELECTORS = {
  version: '2026-07-29.portfolio-project-v2',

  profileReady: [
    '[data-qa-profile-viewer-uid]',
    '.visitor-profile-redesign .profile-container',
    'main#main [itemtype="http://schema.org/Person"]',
  ],

  expandBeforeScrape: [
    '#hor-anc-id-about [data-ev-label="truncation_toggle"][aria-expanded="false"]',
    '#hor-anc-id-about .air3-truncation-btn[aria-expanded="false"]',
    '[data-qa-profile-viewer-uid] [data-ev-label="line_clamp_toggle"][aria-expanded="false"]',
    '#hor-anc-id-skills .skills > ul > li > div.skill-name.cursor-pointer',
    '[data-qa-profile-viewer-uid] .profile-outer-card:has(button[aria-label="Add employment history"]) button[data-testid="show-more"]',
  ],

  fields: {
    name: [
      { selector: '[data-qa-profile-viewer-uid] [itemprop="name"]' },
      { selector: '.onboarding-target-profile-identity [itemprop="name"]' },
      { selector: 'meta[property="og:title"]', attribute: 'content' },
      { selector: 'meta[name="twitter:title"]', attribute: 'content' },
      { selector: '.cfe-ui-profile-photo img[alt]', attribute: 'alt' },
    ],
    title: [
      { selector: '[data-qa-profile-viewer-uid] .title-vertical' },
      { selector: '[data-qa-profile-viewer-uid] h3:has(button[aria-label="Edit title"])' },
      { selector: '.onboarding-target-profile-identity .title-vertical' },
      { selector: '[data-test="freelancer-title"]' },
      { selector: '[data-cy="title"]' },
      { selector: 'meta[property="og:description"]', attribute: 'content' },
    ],
    overview: [
      {
        selector: '#hor-anc-id-about [data-test="truncation-text-by-chars"] [id^="air3-truncation-"]',
        preserveWhitespace: true,
        maxLength: 10000,
      },
      {
        selector: '#hor-anc-id-about [data-test="truncation-text-by-chars"] > span:first-child',
        preserveWhitespace: true,
        maxLength: 10000,
      },
      {
        selector: '[data-qa-profile-viewer-uid] .air3-line-clamp[id^="air3-line-clamp-"] .text-pre-line',
        preserveWhitespace: true,
        maxLength: 10000,
      },
      { selector: '[data-test="description"]', preserveWhitespace: true, maxLength: 10000 },
      { selector: 'section[data-test="profile-overview"]', preserveWhitespace: true, maxLength: 10000 },
      { selector: '[data-cy="air3-line-clamp"]', preserveWhitespace: true, maxLength: 10000 },
    ],
    hourlyRate: [
      { selector: '#hor-anc-id-about .overview-card .text-base-sm' },
      { selector: '[data-qa-profile-viewer-uid] h3:has(button[aria-label="Edit hourly rate"]) strong' },
      { selector: '[data-test="hourly-rate"]' },
      { selector: '[data-cy="freelancer-rate"]' },
      { selector: 'meta[property="product:price:amount"]', attribute: 'content', prefix: '$', suffix: '/hr' },
    ],
    city: [
      { selector: '#location-time-vertical [itemprop="locality"]' },
      { selector: '#location-time-horizontal [itemprop="locality"]' },
      { selector: '[data-qa-profile-viewer-uid] [itemprop="locality"]' },
      { selector: '[itemprop="addressLocality"]' },
    ],
    country: [
      { selector: '#location-time-vertical [itemprop="country-name"]' },
      { selector: '#location-time-horizontal [itemprop="country-name"]' },
      { selector: '[data-qa-profile-viewer-uid] [itemprop="country-name"]' },
      { selector: '[itemprop="addressCountry"]' },
      { selector: '[data-test="location"]' },
    ],
    localTime: [
      { selector: '#location-time-vertical .flex-shrink-0 span' },
      { selector: '#location-time-vertical [class*="text-body-sm"]' },
      { selector: '#location-time-horizontal .time .flex-shrink-0 span' },
      { selector: '[data-test="local-time"]' },
    ],
    timezone: [
      { selector: '[data-test="timezone"]' },
      { selector: '[data-cy="timezone"]' },
    ],
    profileUrl: [
      { selector: 'link[rel="canonical"]', attribute: 'href' },
      { selector: 'meta[property="og:url"]', attribute: 'content' },
      {
        selector: '[data-qa-profile-viewer-uid] [data-ev-sublocation="share-button"][data-ev-json-data]',
        attribute: 'data-ev-json-data',
        jsonProperty: 'url',
      },
    ],
    profileUid: [
      { selector: '[data-qa-profile-viewer-uid]', attribute: 'data-qa-profile-viewer-uid' },
      { selector: 'meta[property="product:retailer_item_id"]', attribute: 'content' },
    ],
    photoUrl: [
      { selector: '.cfe-ui-profile-photo img[src]', attribute: 'src' },
      { selector: 'meta[property="og:image"]', attribute: 'content' },
      { selector: 'meta[name="twitter:image"]', attribute: 'content' },
    ],
    availabilityStatus: [
      { selector: '.cfe-ui-profile-photo [aria-label^="Status:"]', attribute: 'aria-label' },
      { selector: '[data-test="availability"]' },
    ],
    identityVerified: [
      { selector: '#id-badge-popover .is-verified .sr-only' },
      { selector: '[data-test="identity-verified"]' },
    ],
    rating: [
      { selector: '[data-test="rating-avg"] .ml-1 .text-base-sm' },
      { selector: '[data-test="rating-avg"] .air3-rating-background .sr-only' },
      { selector: '[data-test="rating"]' },
    ],
    reviewCount: [
      { selector: '[data-test="rating-avg"] .ml-1 .text-body-sm' },
      { selector: '[data-test="review-count"]' },
    ],
    availabilityHours: [
      {
        selector:
          '[data-qa-profile-viewer-uid] div:has(> div > button[aria-label="Edit availability"]) > div:nth-child(2) span',
      },
      { selector: '[data-test="availability"]' },
    ],
    contractToHire: [
      { selector: '[data-qa-profile-viewer-uid] [data-testid="c2h-preference"] [data-testid="set-label"]' },
    ],
    responseTime: [
      {
        selector:
          '[data-qa-profile-viewer-uid] [data-ev-response_time] > div > span .air3-popper-trigger',
      },
    ],
    introductionVideoUrl: [
      {
        selector: '[data-qa-profile-viewer-uid] [data-testid="video-thumbnail-container"] img[alt^="http"]',
        attribute: 'alt',
      },
    ],
    availabilityBadge: [
      { selector: '#availability-badge-popover [data-test="popover-hover-trigger"]' },
    ],
  },

  lists: {
    skills: {
      selectors: [
        '#hor-anc-id-skills .skills > ul .skill-name',
        '#hor-anc-id-skills .skill-name',
        '[data-qa-profile-viewer-uid] .skills > ul .skill-name',
        '[data-test="skill"]',
        '[data-cy="skill-item"]',
      ],
      reject: [/^\+\s*\d+\s+more$/i],
      maxItems: 60,
      maxItemLength: 80,
    },
    languages: {
      selectors: [
        '[data-test="languages"] [data-test="language"]',
        '[data-test="language"]',
        '[data-cy="language-item"]',
        '[data-qa-profile-viewer-uid] div:has(> div button[aria-label="Edit language"]) > ul > li',
        '[data-qa-profile-viewer-uid] div:has(> div button[aria-label="Add language"]) > ul > li',
        '.languages .air3-grid-container > div',
      ],
      maxItems: 30,
      maxItemLength: 120,
    },
    specializedProfiles: {
      selectors: [
        '[data-test="specialized-profile-tabs"] [role="tab"]',
        '[data-cy="specialized-profile-tabs"] [role="tab"]',
        '.specialized-profile-tabs [role="tab"]',
      ],
      maxItems: 20,
      maxItemLength: 200,
    },
  },

  metrics: {
    itemSelectors: [
      '[data-qa-profile-viewer-uid] .cfe-ui-profile-summary-stats .col-compact',
      '[data-qa-profile-viewer-uid] .air3-grid-container .air3-card.bg-muted-light',
      '.onboarding-target-profile-identity .air3-card.bg-muted-light',
    ],
    label: [
      { selector: '.text-base-sm' },
      { selector: '.text-caption' },
    ],
    value: [
      { selector: '.stat-amount' },
      { selector: 'h4' },
    ],
    maxItems: 20,
  },

  cards: {
    workHistory: {
      itemSelectors: [
        '#hor-anc-id-work-history .assignments-item',
        '.work-history .assignments-item',
      ],
      maxItems: 50,
      fields: {
        title: [{ selector: 'h5' }],
        rating: [
          { selector: '.air3-rating-value-text' },
          { selector: '.air3-rating-background .sr-only' },
        ],
        dates: [
          { selector: '.air3-rating + .text-vertical-separator ~ span.text-base-sm' },
          { selector: '.assignments-item-dynamic-meta [class*="text-body-sm"]' },
          { selector: '.assignments-item-dynamic-meta' },
        ],
        earnings: [
          { selector: '.air3-grid-container.text-light-on-inverse .span-4 > strong' },
          { selector: '.assignments-item-dynamic-meta strong' },
        ],
        contractType: [
          { selector: '.air3-grid-container.text-light-on-inverse .span-4:nth-child(2)' },
        ],
        feedback: [
          { selector: '.feedback .highlighted-truncation p', preserveWhitespace: true, maxLength: 2000 },
        ],
      },
      lists: {
        skills: {
          selectors: ['.assignment-skills .skill-name'],
          maxItems: 30,
          maxItemLength: 80,
        },
        endorsedSkills: {
          selectors: ['[data-testid="endorsed-skills-section"] .skill-name'],
          maxItems: 30,
          maxItemLength: 80,
        },
      },
    },
    portfolio: {
      itemSelectors: [
        '#hor-anc-id-portfolio .portfolio-v2-shelf-thumbnail',
        '[data-qa-profile-viewer-uid] .portfolio-v2-editor-shelf #published .portfolio-v2-shelf-thumbnail',
        '.portfolio-v2-viewer-shelf .portfolio-v2-shelf-thumbnail',
      ],
      maxItems: 50,
      fields: {
        title: [
          { selector: '.mt-3x .no-underline' },
          { selector: '.mt-3x [href="javascript:"]' },
        ],
        imageUrl: [{ selector: '.air3-thumbnail img[src]', attribute: 'src' }],
      },
      lists: {
        skills: {
          selectors: ['.air3-token-container .skill-name'],
          maxItems: 30,
          maxItemLength: 80,
        },
      },
    },
    clientFeedback: {
      itemSelectors: [
        '[data-qa="feedback-section"] [data-qa]:not([data-qa="feedback-section"])',
        '#hor-anc-id-client-feedback .air3-card-outline',
      ],
      maxItems: 30,
      fields: {
        title: [{ selector: '[data-test="feedback-title"]' }],
        date: [{ selector: '[data-test="feedback-date"]' }],
        rating: [
          { selector: '.air3-rating-value-text' },
          { selector: '.air3-rating-background .sr-only' },
        ],
        comment: [{ selector: '[data-test="feedback-comment"]', preserveWhitespace: true, maxLength: 2000 }],
      },
    },
    education: {
      itemSelectors: [
        '[data-qa-profile-viewer-uid] li:has(button[aria-label$=" Education item"])',
        '#hor-anc-id-education [data-test="education-item"]',
        '[data-test="education"] [data-test="education-item"]',
        '.education-item',
      ],
      maxItems: 30,
      fields: {
        school: [
          { selector: '[data-test="education-school"]' },
          { selector: 'strong' },
          { selector: 'h5' },
        ],
        degree: [
          { selector: '[data-test="education-degree"]' },
          { selector: '.text-body' },
        ],
        dates: [
          { selector: '[data-test="education-dates"]' },
          { selector: '.text-light' },
        ],
      },
    },
    employment: {
      itemSelectors: [
        '[data-qa-profile-viewer-uid] .air3-card-section.px-0:has(button[aria-label$=" Employment history item"])',
        '#hor-anc-id-employment [data-test="employment-item"]',
        '[data-test="employment"] [data-test="employment-item"]',
        '.employment-item',
      ],
      maxItems: 30,
      fields: {
        title: [
          { selector: '[data-test="employment-title"]' },
          { selector: 'h4' },
          { selector: 'h5' },
        ],
        company: [{ selector: '[data-test="employment-company"]' }],
        dates: [
          { selector: '[data-test="employment-dates"]' },
          { selector: '.mt-3x.text-light-on-inverse' },
          { selector: '.text-light' },
        ],
        description: [
          { selector: '[data-test="employment-description"]', preserveWhitespace: true, maxLength: 2000 },
          { selector: '.air3-line-clamp .text-pre-line', preserveWhitespace: true, maxLength: 2000 },
        ],
      },
    },
    certifications: {
      itemSelectors: [
        '#hor-anc-id-certifications [data-test="certificate-item"]',
        '[data-test="certifications"] [data-test="certificate-item"]',
        '.certificate-item',
      ],
      maxItems: 30,
      fields: {
        name: [
          { selector: '[data-test="certificate-name"]' },
          { selector: 'h5' },
        ],
        issuer: [{ selector: '[data-test="certificate-issuer"]' }],
        date: [{ selector: '[data-test="certificate-date"]' }],
      },
    },
    projectCatalog: {
      itemSelectors: [
        '[data-qa-profile-viewer-uid] [data-cy^="product-"]',
      ],
      maxItems: 50,
      fields: {
        uid: [{ selector: ':scope', attribute: 'data-cy' }],
        title: [{ selector: 'h4' }],
        startingPrice: [{ selector: '.product-price-start' }],
        deliveryTime: [{ selector: '.delivery-days' }],
        projectUrl: [{ selector: '.view-project-button[href]', attribute: 'href' }],
        enabledOnProfile: [{ selector: '.air3-switch[aria-pressed]', attribute: 'aria-pressed' }],
      },
    },
    linkedAccounts: {
      itemSelectors: [
        '[data-qa-profile-viewer-uid] [data-qa="linked-accounts"] > .py-4x > div',
      ],
      maxItems: 20,
      fields: {
        platform: [{ selector: '.title' }],
        username: [{ selector: '.username' }],
        connectedSince: [{ selector: '.since' }],
        followers: [{ selector: '.followers' }],
        avatarUrl: [{ selector: '.avatar img[src]', attribute: 'src' }],
      },
    },
  },

  /**
   * Fullscreen portfolio project modal (`/freelancers/{slug}?p=`).
   * Ordered fallbacks — first non-empty match wins (same idea as profile fields).
   */
  portfolioProject: {
    root: [
      '.air3-modal.air3-modal-portfolio-v2-viewer-modal.is-fullscreen',
      '.air3-modal.air3-modal-portfolio-v2-viewer-modal',
      '.air3-modal-portfolio-v2-viewer-modal',
      '[class*="air3-modal-portfolio-v2-viewer-modal"]',
    ],
    leftColumn: [
      '.portfolio-v2-viewer .sticky-left-column',
      '.air3-modal-portfolio-v2-viewer-modal .sticky-left-column',
      '.sticky-left-column',
      '.portfolio-v2-viewer .span-lg-4 > .air3-grid-container',
      '.portfolio-v2-viewer .span-12.span-lg-4',
    ],
    fields: {
      title: [
        { selector: '.air3-modal-header h2 .vertical-align-middle' },
        { selector: '.air3-modal-header h2' },
        { selector: '.portfolio-v2-viewer h2 .vertical-align-middle' },
        { selector: '.portfolio-v2-viewer h2' },
        { selector: '.air3-modal-portfolio-v2-viewer-modal h2' },
        { selector: 'h2.m-0' },
      ],
      profileUrl: [
        { selector: '.portfolio-v2-viewer a.up-n-link[href*="/freelancers/"]', attribute: 'href' },
        { selector: 'a.up-n-link[href*="/freelancers/"]', attribute: 'href' },
        { selector: '.air3-modal-portfolio-v2-viewer-modal a[href*="/freelancers/"]', attribute: 'href' },
        { selector: 'a[href*="/freelancers/"][class*="up-n-link"]', attribute: 'href' },
      ],
    },
    labeledFields: {
      role: {
        labelPatterns: [/^My role\.?$/i, /^Role\.?$/i],
        blockSelectors: [
          '.sticky-left-column .span-12.text-body:not(.text-pre-line)',
          '.sticky-left-column .span-12.text-body',
          '.sticky-left-column .span-12',
          '.portfolio-v2-viewer .span-lg-4 .span-12.text-body',
        ],
        labelSelectors: ['span.text-light', '.text-light'],
        maxLength: 200,
      },
      description: {
        labelPatterns: [/^Project description\.?$/i, /^Description\.?$/i],
        blockSelectors: [
          '.sticky-left-column .span-12.text-body.text-pre-line',
          '.sticky-left-column .span-12.text-pre-line',
          '.sticky-left-column .span-12.text-body',
          '.sticky-left-column .span-12',
          '.portfolio-v2-viewer .span-lg-4 .span-12.text-pre-line',
        ],
        labelSelectors: ['span.text-light', '.text-light'],
        preserveWhitespace: true,
        maxLength: 20000,
      },
    },
    lists: {
      technologies: {
        selectors: [
          '.sticky-left-column .air3-token-wrap .air3-token',
          '.sticky-left-column .air3-token',
          '.portfolio-v2-viewer .air3-token-wrap .air3-token',
          '.air3-modal-portfolio-v2-viewer-modal .air3-token-wrap .air3-token',
          '.air3-modal-portfolio-v2-viewer-modal .air3-token',
        ],
        maxItems: 50,
        maxItemLength: 80,
      },
    },
    publishedOn: {
      selectors: [
        '.sticky-left-column small.text-light',
        '.sticky-left-column small',
        '.portfolio-v2-viewer .span-lg-4 small.text-light',
        '.air3-modal-portfolio-v2-viewer-modal small.text-light',
      ],
      patterns: [/^Published on\s+(.+)$/i, /^Published:\s*(.+)$/i],
    },
    images: {
      selectors: [
        '.portfolio-v2-viewer-media-block img[src]',
        '.portfolio-v2-viewer-media-block-image img[src]',
        '.portfolio-v2-viewer img[src*="/att/download/portfolio/"]',
        '.air3-modal-portfolio-v2-viewer-modal img[src*="/att/download/portfolio/"]',
        '.air3-modal-portfolio-v2-viewer-modal img[src*="portfolio"]',
      ],
      attribute: 'src',
      maxItems: 30,
    },
    externalLinks: {
      scopeSelectors: [
        '.sticky-left-column',
        '.portfolio-v2-viewer .span-lg-4',
        '.air3-modal-portfolio-v2-viewer-modal .span-lg-4',
      ],
      selectors: ['a[href^="https://"]', 'a[href^="http://"]'],
      excludeHostSuffixes: ['upwork.com'],
      maxItems: 20,
    },
  },
};
