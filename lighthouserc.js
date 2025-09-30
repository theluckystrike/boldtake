module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      startServerCommand: 'echo "No server needed for extension"',
      url: ['https://x.com'],
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.5 }],
        'categories:accessibility': ['warn', { minScore: 0.5 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
