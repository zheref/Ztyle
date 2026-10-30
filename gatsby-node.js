// Browser instrumentation is opt-in and is absent from ordinary production builds.
exports.onCreateBabelConfig = ({ actions }) => {
  if (process.env.ZTYLE_BROWSER_COVERAGE !== '1') return;
  actions.setBabelPlugin({
    name: require.resolve('babel-plugin-istanbul'),
    options: { include: ['src/pages/index.js', 'src/components/PlannerCalendar.js'], exclude: [] },
  });
};
exports.onCreateWebpackConfig = ({ stage, actions }) => {
  if (process.env.ZTYLE_BROWSER_COVERAGE !== '1' || stage !== 'build-javascript') return;
  const fs = require('node:fs');
  const path = require('node:path');
  const { BannerPlugin } = require('webpack');
  const manifest = fs.readFileSync('.nen/browser/build.json', 'utf8');
  const harness = fs.readFileSync(path.join(__dirname, 'tests/browser/entry.js'), 'utf8')
    .replace("import manifest from '../../.nen/browser/build.json';", 'const manifest = '+manifest+';');
  actions.setWebpackConfig({plugins:[new BannerPlugin({banner:'(function(){'+harness+'})();',raw:true,entryOnly:true,include:/app/})]});
};
