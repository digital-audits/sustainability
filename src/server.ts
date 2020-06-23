import {urlIsValid, headTestPassed} from './helpers/validUrl';
import {Queue, QueueEvents} from 'bullmq';
import Runner from './sustainability/sustainability';
import {safeReject} from './helpers/safeReject';
import express = require('express');

const bodyParser = require('body-parser');
const Redis = require('ioredis');

export default class App {
	private readonly port: number = Number(process.env.PORT) || 7200;
	private readonly runner: Runner = new Runner();

	async init() {
		try {
			const app = express();
			app.use(bodyParser.urlencoded({extended: true}));
			app.use(bodyParser.json());
			app.listen(this.port, () =>
				console.log('Server running on port :', this.port)
			);

			const queue = this.initRedis();
			await this.runner.init();
			this.listeners(app, queue);
		} catch (error) {
			safeReject(error);
		}
	}

	private initRedis(): Queue {
		const connection = new Redis();
		const queue = new Queue('main', {connection});
		this.queueEvents();
		return queue;
	}

	private queueEvents() {
		const queueEvents = new QueueEvents('main');
		queueEvents.on('waiting', ({jobId}) => {
			console.log(`A job with ID ${jobId} is waiting`);
		});

		queueEvents.on('active', ({jobId, prev}) => {
			console.log(`Job ${jobId} is now active; previous status was ${prev}`);
		});

		queueEvents.on('completed', ({jobId, returnvalue}) => {
			console.log(`${jobId} has completed and returned ${returnvalue}`);
		});

		queueEvents.on('failed', ({jobId, failedReason}) => {
			console.log(`${jobId} has failed with reason ${failedReason}`);
		});
	}

	private async gracefullyCloseServer(queue: Queue) {
		await Promise.all([
			queue.close(),
			queue.disconnect(),
			this.runner.shutdown()
		]);
	}

	private listeners(app: express.Application, queue: Queue): void {
		const queueEvents = new QueueEvents('main');

		app.get('/health', (_, res) => {
			res.sendStatus(200);
		});

		app.post(
			'/service/add',
			async (request, res): Promise<any> => {
				let {url} = request.body;

				if (typeof url === 'string') {
					url = url.trim();
				}

				if (typeof url !== 'string' || !urlIsValid(url)) {
					return res.status(400).send({status: 'Error invalid URL'});
				}

				if (!url.startsWith('http')) {
					url = 'https://' + url;
				}

				const isValidHeadRequest = await headTestPassed(url);

				if (isValidHeadRequest) {
					const job = await queue.add('audit', {
						url
					});
					const _jobId = job.id;
					queueEvents.on('completed', ({jobId, returnvalue}) => {
						if (_jobId === jobId) {
							res.status(200).send({...returnvalue});
						}
					});
					queueEvents.on('failed', ({jobId, failedReason}) => {
						if (_jobId === jobId) {
							res.send(500).json(failedReason);
						}
					});
				} else {
					return res.status(400).send({status: 'Error unknown URL'});
				}
			}
		);

		app.get('/service/close', async (_, res) => {
			this.gracefullyCloseServer(queue);
			res.sendStatus(200);
		});
	}
}
