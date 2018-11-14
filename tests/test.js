const { expect } = require('chai');
const path = require('path');
const adapter = require('../lib/s3-adapter');
const moment = require('moment');
const { BUCKETS_NAMES } = require('../consts/buckets-names');
const DateFormat = 'YYYY-MM-DD';

describe('s3-adapter', () => {
    before(async () => {
        const options = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAIOSFODNN7EXAMPLE',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            endpoint: process.env.AWS_ENDPOINT || 'http://127.0.0.1:9000'
        };
        await adapter.init(options, null, true);
    });
    describe('put', () => {
        it('put and get same value', async () => {
            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2015-01-27').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });
            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2015-01-26').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });
            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2015-01-25').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });
            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2015-01-24').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });
            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2015-01-23').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });
            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2015-01-22').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });
            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2015-01-21').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });

            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2018-06-21').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });
            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2018-06-22').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });
            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2018-06-23').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });
            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2018-06-24').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });
            await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment('2018-06-25').format(DateFormat), 'test1', 'test1.json'), Data: { data: 'sss' } });

            const link = await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment().format(DateFormat), Date.now().toString(), 'task-1'), Data: 'test' });
            const res = await adapter.get(link);
            expect(res).to.equal('test');
        });
        it('put result', async () => {
            const link = await adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE_RESULTS, moment().format(this.DateFormat), 'job-id', 'result.json'), Data: 'test' });
            const res = await adapter.get(link);
            expect(res).to.equal('test');
        });
        xit('get all tasks of specific jobid', async () => {
            const jobId = Date.now();
            const results = await Promise.all([
                adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, `${moment().format(DateFormat)}/${jobId}/0`), Data: 'test0' }),
                adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, `${moment().format(DateFormat)}/${jobId}/1`), Data: 'test1' }),
                adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, `${moment().format(DateFormat)}/${jobId}/2`), Data: 'test2' }),
                adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, `${moment().format(DateFormat)}/${jobId}/3`), Data: 'test3' }),
                adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, `${moment().format(DateFormat)}/${jobId}/4`), Data: 'test4' }),
                adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, `${moment().format(DateFormat)}/${jobId}/5`), Data: 'test5' }),
                adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, `${moment().format(DateFormat)}/${jobId}/6`), Data: 'test6' })]);

            const res = await adapter.listObjects({ Filter: `${moment().format(adapter.DateFormat)}/${jobId}` });
            expect(res[moment().format(adapter.DateFormat)].length).to.equal(7);

            for (let i = 0; i < results.length; i += 1) {
                const r = await adapter.get(results[i]);
                expect(r).to.equal('test' + i);
            }
        });
        xit('get more than 3000 items', async () => {
            const promiseArray = [];
            for (let i = 0; i < 3500; i += 1) {
                promiseArray.push(adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment().format(DateFormat), 'more-than-3000-keys', 'task' + i), Data: `test${i}` }));
            }
            await Promise.all(promiseArray);
            const res = await adapter.listObjects({ Filter: `${moment().format(DateFormat)}/more-than-3000-keys` });
            expect(res[moment().format(DateFormat)].length).to.equal(3500);
        }).timeout(40000);
        xit('delete by date', async () => {
            await adapter._put({ Bucket: BUCKETS_NAMES.HKUBE, Key: `${moment('2015-01-14').format(adapter.DateFormat)}/test1/test1.json`, Body: { data: 'sss' } });
            await adapter._put({ Bucket: BUCKETS_NAMES.HKUBE, Key: `${moment('2015-01-14').format(adapter.DateFormat)}/test2/test2.json`, Body: { data: 'sss' } });
            await adapter._put({ Bucket: BUCKETS_NAMES.HKUBE, Key: `${moment('2015-01-14').format(adapter.DateFormat)}/test3/test3.json`, Body: { data: 'sss' } });
            await adapter._put({ Bucket: BUCKETS_NAMES.HKUBE, Key: `${moment('2015-01-14').format(adapter.DateFormat)}/test4/test4.json`, Body: { data: 'sss' } });
            await adapter._put({ Bucket: BUCKETS_NAMES.HKUBE, Key: `${moment('2015-01-14').format(adapter.DateFormat)}/test1/test2.json`, Body: { data: 'sss' } });
            await adapter._put({ Bucket: BUCKETS_NAMES.HKUBE, Key: `${moment('2015-01-14').format(adapter.DateFormat)}/test2/test3.json`, Body: { data: 'sss' } });
            await adapter._put({ Bucket: BUCKETS_NAMES.HKUBE, Key: `${moment('2015-01-14').format(adapter.DateFormat)}/test3/test4.json`, Body: { data: 'sss' } });
            await adapter._put({ Bucket: BUCKETS_NAMES.HKUBE, Key: `${moment('2015-01-14').format(adapter.DateFormat)}/test3/test5.json`, Body: { data: 'sss' } });
            await adapter._put({ Bucket: BUCKETS_NAMES.HKUBE, Key: `${moment('2015-01-14').format(adapter.DateFormat)}/test3/test6.json`, Body: { data: 'sss' } });
            await adapter._put({ Bucket: BUCKETS_NAMES.HKUBE, Key: `${moment('2015-01-14').format(adapter.DateFormat)}/test3/test7.json`, Body: { data: 'sss' } });

            const res = await adapter.deleteByDate({ Date: new Date('2015-01-14') });
            expect(res.Deleted.length).to.equal(11);
        }).timeout(5000);
        xit('delete by date more than 3000 items', async () => {
            const promiseArray = [];
            for (let i = 0; i < 3500; i += 1) {
                promiseArray.push(adapter._put({ Bucket: BUCKETS_NAMES.HKUBE, Key: `${moment('2014-11-28').format(adapter.DateFormat)}/test3/test${i}.json`, Body: { data: 'sss' } }));
            }
            await Promise.all(promiseArray);
            const res = await adapter.deleteByDate({ Date: new Date('2014-11-28') });
            expect(res.Deleted.length).to.equal(3501);
        }).timeout(40000);
        xit('list objects without filter', async () => {
            const jobId = Date.now();
            await Promise.all([
                adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment().format(DateFormat), jobId, '0'), Data: 'test0' }),
                adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE, moment().format(DateFormat), jobId, '0'), Data: 'test0' }),
                adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE_RESULTS, moment().format(this.DateFormat), jobId, 'result.json'), Data: 'test0' }),
                adapter.put({ Path: path.join(BUCKETS_NAMES.HKUBE_RESULTS, moment().format(this.DateFormat), jobId, 'result.json'), Data: 'test6' })]);
            const res1 = await adapter.listObjects();
            expect(res1[moment().format(adapter.DateFormat)].length > 0).to.be.true;
            const res2 = await adapter.listObjectsResults();
            expect(res2[moment().format(adapter.DateFormat)].length > 0).to.be.true;
        }).timeout(40000);
    });
});
