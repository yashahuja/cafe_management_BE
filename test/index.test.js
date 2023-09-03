const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const expect = chai.expect;

const app = require('../index'); // Make sure the path is correct
const dbConfig = require('../config'); // Make sure the path is correct

chai.use(chaiHttp);

describe('GET /getChartValues', function () {

  let firestoreStub;
  let mockQuerySnapshot;

  beforeEach(function () {
    mockQuerySnapshot = {
      docs: [{ data: () => ({ lat: "40", lon: "-74", date: '2023-09-01', quality: 'Good' }) }]
    };

    firestoreStub = sinon.stub(dbConfig.admin.firestore().collection('AirQualityData'), 'where')
      .onCall(0).returnsThis()
      .onCall(1).returns({ get: () => Promise.resolve(mockQuerySnapshot) });
  });

  afterEach(function () {
    firestoreStub.restore();
  });

  it('should return air quality data in an array', async function () {
    const res = await chai.request(app)
      .get('/aqi/chartData')
      .set('fromDate', '2023-08-01')
      .set('toDate', '2023-09-02')
      .set('lat', '40')
      .set('lon', '-74');

    expect(res.status).to.equal(200);
    expect(typeof res.body).to.equal(typeof []);
  }).timeout(3500);
});

describe('POST /update', () => {
  let updateUserStub;
  let addDocumentStub;
  let dbConfig;

  beforeEach(() => {
    // Stub the updateUser method
    updateUserStub = sinon.stub().resolves({
      uid: 'some-uid',
      displayName: 'John Doe',
      phoneNumber: '+1234567890'
    });

    // Stub the Firestore add method
    addDocumentStub = sinon.stub().resolves();

    // Stub dbConfig to return our stubs
    dbConfig = {
      admin: {
        auth: () => ({
          updateUser: updateUserStub
        }),
        firestore: () => ({
          collection: () => ({
            add: addDocumentStub
          })
        })
      }
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return no user found message', done => {
    chai.request(app)
      .post('/user/update')
      .send({
        body: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'password',
          phoneNumber: '+1234567890',
          role: 'user',
          uid: 'some-uid'
        }
      })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.message).to.equal('There is no user record corresponding to the provided identifier.');
        done();
      });
  });

  it('should return an error message for invalid phone number', done => {
    updateUserStub.rejects(new Error('Invalid phone number'));

    chai.request(app)
      .post('/user/update')
      .send({
        body: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'password',
          phoneNumber: '1234567890',  // Missing country code
          role: 'user',
          uid: 'some-uid'
        }
      })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.message).to.equal('Please enter your phone number with the country code (eg +353).');
        expect(res.body.errorCode).to.equal(500);
        done();
      });
  });
});

describe('GET /role', () => {
  let querySnapshotStub;
  let dbConfig;
  beforeEach(() => {
    // Stub the Firestore query
    querySnapshotStub = {
      empty: false,
      docs: [
        { data: () => ({ role: 'contributer' }) }
      ],
    };

    // Stub Firestore methods
    const firestoreStub = {
      collection: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      get: sinon.stub().returns(Promise.resolve(querySnapshotStub)),
    };

    // Stub dbConfig to return our stubs
    dbConfig = {
      admin: {
        firestore: sinon.stub().returns(firestoreStub),
      },
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return user role', done => {
    chai.request(app)
      .get('/user/role')
      .set('uid', 'some-uid')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(401);
        expect(res.body.error).to.equal('You are not authorized to make this request');
        done();
      });
  });
});
