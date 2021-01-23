# Changelog

## v. 0.4.0

- Achieved 100% coverage
- Added research notes
- New logo
- Needs node ^10.0.x

### Dependency updates

- Node fetch (3.0.0)

### API Audit Settings

- Removed Page object
- New streams boolean option in connection settings
- New coldRun boolean option in connection settings

### Class Sustainability

- New auditStream member: a readable stream of audits to pipe from

### Cold run

A cold run with minimal setup is made to catch page redirects (3xx) and their location.
If the origin URL redirects to another URL, the second one is tested and a warning message is displayed in the output report. Defaults to true. Can be tweaked to your needs with the coldRun option.

### New collectors (+6)

- New lazy media collect
- New meta tag collect
- New robots collect
- New animations collect
- New screenshot collect
- New cookies collect
- Transfer collect now also gathers cache info

### New audits (+8)

- New avoidable bot traffic audit
- New avoid inline assets audit
- New cookie optimisation audit
- New leverage browser cache audit
- New pixel energy efficiency audit
- New reactive animations audit
- New WebM video format audit
- New avoid URL redirect audit

### Bug fixes

- WebP audit failing on jpeg images
