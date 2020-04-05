const { expect } = require('chai');
const path = require('path');
const moment = require('moment');
const { EncodingTypes, Encoding } = require('@hkube/encoding');
const S3Adapter = require('../lib/s3-adapter');
const BUCKETS_NAMES = {
    HKUBE: 'hkube',
    HKUBE_RESULTS: 'hkube-results',
    HKUBE_METADATA: 'hkube-metadata',
    HKUBE_STORE: 'hkube-store',
    HKUBE_EXECUTION: 'hkube-execution',
    HKUBE_INDEX: 'hkube-index'
};
const DateFormat = 'YYYY-MM-DD';
let adapter = new S3Adapter();

const options = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    endpoint: process.env.AWS_ENDPOINT || 'http://127.0.0.1:9000'
};

describe(`s3-adapter`, () => {
    before(async () => {
        await adapter.init(options, BUCKETS_NAMES, true);
    });

    EncodingTypes.forEach((o) => {
        describe(`s3-adapter ${o}`, () => {
            before(async() => {
                adapter = new S3Adapter();
                await adapter.init(options, BUCKETS_NAMES, false);

                const encoding = new Encoding({ type: o });

                const wrapperGet = (fn) => {
                    const wrapper = async (args) => {
                        const result = await fn(args);
                        return encoding.decode(result);
                    };
                    return wrapper;
                };

                const wrapperPut = (fn) => {
                    const wrapper = (args) => {
                        const data = (!args.ignoreEncode && encoding.encode(args.data)) || args.data;
                        return fn({ ...args, data });
                    };
                    return wrapper;
                };

                adapter.put = wrapperPut(adapter.put.bind(adapter));
                adapter.get = wrapperGet(adapter.get.bind(adapter));
            });
            it(`put result`, async () => {
                const link = await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE_RESULTS, o, moment().format(DateFormat), 'job-id', 'result.json'), data: 'test' });
                const res = await adapter.get(link);
                expect(res).to.equal('test');
            });
            it(`get all tasks of specific jobid`, async () => {
                const jobId = Date.now();
                const results = await Promise.all([
                    adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, `${moment().format(DateFormat)}/${jobId}/0`), data: 'test0' }),
                    adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, `${moment().format(DateFormat)}/${jobId}/1`), data: 'test1' }),
                    adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, `${moment().format(DateFormat)}/${jobId}/2`), data: 'test2' }),
                    adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, `${moment().format(DateFormat)}/${jobId}/3`), data: 'test3' }),
                    adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, `${moment().format(DateFormat)}/${jobId}/4`), data: 'test4' }),
                    adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, `${moment().format(DateFormat)}/${jobId}/5`), data: 'test5' }),
                    adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, `${moment().format(DateFormat)}/${jobId}/6`), data: 'test6' })]);

                const res = await adapter.list({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment().format(DateFormat), jobId.toString()) });
                expect(res.length).to.equal(7);

                for (let i = 0; i < results.length; i += 1) {
                    const r = await adapter.get(results[i]);
                    expect(r).to.equal('test' + i);
                }
            });
            it(`get more than 3000 items`, async () => {
                const promiseArray = [];
                for (let i = 0; i < 3500; i += 1) {
                    promiseArray.push(adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, o, moment().format(DateFormat), 'more-than-3000-keys', 'task' + i), data: `test${i}` }));
                }
                await Promise.all(promiseArray);
                const res = await adapter.list({ path: path.join(BUCKETS_NAMES.HKUBE, o, o, moment().format(DateFormat), 'more-than-3000-keys') });
                expect(res.length).to.equal(3500);
            }).timeout(80000);
            it(`delete more than 3000 items`, async () => {
                {
                    const promiseArray = [];
                    for (let i = 0; i < 3500; i += 1) {
                        promiseArray.push(adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment().format(DateFormat), 'more-than-3000-keys2', 'task' + i), data: `test${i}` }));
                    }
                    await Promise.all(promiseArray);
                    const res = await adapter.list({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment().format(DateFormat), 'more-than-3000-keys2') });
                    expect(res.length).to.equal(3500);

                    await adapter.delete({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment().format(DateFormat), 'more-than-3000-keys2') });
                    const res2 = await adapter.list({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment().format(DateFormat), 'more-than-3000-keys2') });
                    expect(res2.length).to.equal(0);
                }
            }).timeout(80000);
            it(`delete by date`, async () => {
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test1', 'test1.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test2', 'test2.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test3', 'test3.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test4', 'test4.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test1', 'test2.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test2', 'test3.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test3', 'test4.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test3', 'test5.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test3', 'test6.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test3', 'test7.json'), data: { data: 'sss' } });

                await adapter.delete({ path: path.join(BUCKETS_NAMES.HKUBE, o, '2015-01-14') });
                const res0 = await adapter.list({ path: path.join(BUCKETS_NAMES.HKUBE, o, '2015-01-14') });
                expect(res0.length).to.equal(0);

                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test1', 'test1.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test2', 'test2.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test3', 'test3.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test4', 'test4.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test1', 'test2.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test2', 'test3.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test3', 'test4.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test3', 'test5.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test3', 'test6.json'), data: { data: 'sss' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2015-01-14').format(DateFormat), 'test3', 'test7.json'), data: { data: 'sss' } });

                await adapter.delete({ path: path.join(BUCKETS_NAMES.HKUBE, o, '2015-01-14/test1') });
                const res1 = await adapter.list({ path: path.join(BUCKETS_NAMES.HKUBE, o, '2015-01-14/test1') });
                expect(res1.length).to.equal(0);

                await adapter.delete({ path: path.join(BUCKETS_NAMES.HKUBE, o, '2015-01-14/test2') });
                const res2 = await adapter.list({ path: path.join(BUCKETS_NAMES.HKUBE, o, '2015-01-14/test2') });
                expect(res2.length).to.equal(0);

                await adapter.delete({ path: path.join(BUCKETS_NAMES.HKUBE, o, '2015-01-14/test3') });
                const res3 = await adapter.list({ path: path.join(BUCKETS_NAMES.HKUBE, o, '2015-01-14/test3') });
                expect(res3.length).to.equal(0);
            }).timeout(80000);
            it(`delete by date more than 3000 items`, async () => {
                const promiseArray = [];
                for (let i = 0; i < 3500; i += 1) {
                    promiseArray.push(adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment('2014-11-28').format(DateFormat), 'test3', `test${i}.json`), data: { data: 'sss' } }));
                }
                await Promise.all(promiseArray);
                await adapter.delete({ path: path.join(BUCKETS_NAMES.HKUBE, o, '2014-11-28') });
                const res2 = await adapter.list({ path: path.join(BUCKETS_NAMES.HKUBE, o, '2014-11-28') });
                expect(res2.length).to.equal(0);
            }).timeout(80000);
            it(`list objects without prefix`, async () => {
                const jobId = Date.now().toString();
                await Promise.all([
                    adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment().format(DateFormat), jobId, '0'), data: 'test0' }),
                    adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE, o, moment().format(DateFormat), jobId, '0'), data: 'test0' }),
                    adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE_RESULTS, o, moment().format(this.DateFormat), jobId, 'result.json'), data: 'test0' }),
                    adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE_RESULTS, o, moment().format(this.DateFormat), jobId, 'result.json'), data: 'test6' })]);
                const res1 = await adapter.list({ path: path.join(BUCKETS_NAMES.HKUBE, o, '/') });
                expect(res1.length > 0).to.be.true;
                const res2 = await adapter.list({ path: path.join(BUCKETS_NAMES.HKUBE_RESULTS, o, '/') });
                expect(res2.length > 0).to.be.true;
            }).timeout(80000);
            it(`list objects with delimiter`, async () => {
                const jobId = Date.now().toString();
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE_INDEX, '2019-01-01', jobId, '0'), data: { data: 'sss1' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE_INDEX, '2019-01-02', jobId, '1'), data: { data: 'sss2' } });
                await adapter.put({ path: path.join(BUCKETS_NAMES.HKUBE_INDEX, '2019-01-03', jobId, '2'), data: { data: 'sss3' } });

                const rd = await adapter.listPrefixes({ path: BUCKETS_NAMES.HKUBE_INDEX });
                expect(rd.includes('2019-01-01')).to.be.true;
                expect(rd.includes('2019-01-02')).to.be.true;
                expect(rd.includes('2019-01-03')).to.be.true;
            }).timeout(80000);
        });
    })
})