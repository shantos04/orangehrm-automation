// cucumber.js
module.exports = {
  default: {
    requireModule: ['ts-node/register'], 
    require: [
      'tests/bdd/steps/**/*.ts',       
      'tests/bdd/support/**/*.ts'      
    ],
    paths: [
      'tests/bdd/features/**/*.feature' 
    ],
    format: ['progress-bar', 'html:cucumber-report.html'],
    publishQuiet: true
  }
}