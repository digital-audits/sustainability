import CollectTransfer from '../collect/transfer.collect';
import CollectFailedTransfers from '../collect/failed-transfer.collect';
import CollectRedirect from '../collect/redirect.collect';
import CollectConsole from '../collect/console.collect';
import CollectSubfont from '../collect/subfont.collect';
import CollectAssets from '../collect/assets.collect';
import CollectImages from '../collect/images.collect';
import UsesCompressionAudit from '../audits/UsesCompression.audit';
import CarbonFootprintAudit from '../audits/CarbonFootprint.audit';
import UsesHTTP2Audit from '../audits/UsesHTTP2.audit';
import UsesGreenServerAudit from '../audits/UsesGreenServer.audit';
import UsesWebpImageFormatAudit from '../audits/UsesWebpImageFormat.audit';
import NoConsoleLogsAudit from '../audits/NoConsoleLogs.audit';
import UsesFontSubsettingAudit from '../audits/UsesFontSubsetting.audit';
import UsesLazyLoadingAudit from '../audits/UsesLazyLoading.audit';
import {DefaultSettings} from '../types/settings';

export const DEFAULT: DefaultSettings = {
	LAUNCH_SETTINGS: {
		headless: true,
		timeout: 0
	},
	CONNECTION_SETTINGS: {
		maxNavigationTime: 60 * 1000,
		maxScrollInterval: 30,
		maxThrottle: 5000,
		emulatedDevice: {
			name: 'Desktop 1920x1080',
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36',
			viewport: {
				width: 1920,
				height: 1080
			}
		},
		location: {
			name: 'Seattle',
			latitude: 47.6062,
			longitude: -122.3331,
			accuracy: 100
		}
	},
	CATEGORIES: {
		server: {
			description:
				'Server aspects which are essential for online sustainability: green hosting, carbon footprint, data transfer.'
		},
		design: {
			description:
				'Hands-on the website assets that convert code to user-friendly content: images, css stylesheets, scripts, fonts.'
		}
	},
	AUDITS: {
		collectors: [
			CollectTransfer,
			CollectFailedTransfers,
			CollectRedirect,
			CollectConsole,
			CollectSubfont,
			CollectAssets,
			CollectImages
		],
		audits: [
			UsesCompressionAudit,
			CarbonFootprintAudit,
			UsesHTTP2Audit,
			UsesGreenServerAudit,
			UsesWebpImageFormatAudit,
			NoConsoleLogsAudit,
			UsesFontSubsettingAudit,
			UsesLazyLoadingAudit
		]
	},
	REPORT: {
		scoringWeight: {
			server: 0.23076923076923078,
			js: 0.15384615384615385,
			css: 0.07692307692307693,
			html: 0.07692307692307693,
			fonts: 0.07692307692307693,
			media: 0.15384615384615385,
			transfer: 0.23076923076923078
		},
		scoring: {
			CF: {median: 4, p10: 1.2, name: 'Carbon Footprint'}
		}
	}
};
