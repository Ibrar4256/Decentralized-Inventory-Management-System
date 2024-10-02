const CourierManager = artifacts.require('CourierManager');

contract('CourierManager', (accounts) => {
  let courierManager;

  beforeEach(async () => {
    courierManager = await CourierManager.new();
  });

  it('should add a new courier', async () => {
    const title = 'Courier Title';
    const description = 'Courier Description';
    const value = web3.utils.toWei('0.1', 'ether');

    const result = await courierManager.addCourier(title, description, { from: accounts[0], value });
    const courierCount = await courierManager.courierCount();
    const event = result.logs[0].args;

    assert.equal(courierCount, 1, 'Courier count is incorrect');
    assert.equal(event.id, 0, 'Courier ID is incorrect');
    assert.equal(event.title, title, 'Courier title is incorrect');
    assert.equal(event.description, description, 'Courier description is incorrect');
    assert.equal(event.courier, accounts[0], 'Courier address is incorrect');
  });

  it('should not add a courier without ETH', async () => {
    const title = 'Courier Title';
    const description = 'Courier Description';

    try {
      await courierManager.addCourier(title, description, { from: accounts[0], value: 0 });
      assert.fail('Expected an error to be thrown');
    } catch (error) {
      assert.include(error.message, 'You must send some ETH to add a courier.', 'Incorrect error message');
    }
  });

  it('should remove a courier', async () => {
    const title = 'Courier Title';
    const description = 'Courier Description';
    const value = web3.utils.toWei('0.1', 'ether');

    const result = await courierManager.addCourier(title, description, { from: accounts[0], value });
    const id = result.logs[0].args.id;

    const removedResult = await courierManager.removeCourier(id, { from: accounts[0] });
    const event = removedResult.logs[0].args;

    assert.equal(event.id, id, 'Courier ID is incorrect');
  });

  it('should not remove a courier by a different account', async () => {
    const title = 'Courier Title';
    const description = 'Courier Description';
    const value = web3.utils.toWei('0.1', 'ether');

    const result = await courierManager.addCourier(title, description, { from: accounts[0], value });
    const id = result.logs[0].args.id;

    try {
      await courierManager.removeCourier(id, { from: accounts[1] });
      assert.fail('Expected an error to be thrown');
    } catch (error) {
      assert.include(error.message, 'You can only remove your own courier.', 'Incorrect error message');
    }
  });

  it('should get all couriers', async () => {
    const title1 = 'Courier Title 1';
    const description1 = 'Courier Description 1';
    const value1 = web3.utils.toWei('0.1', 'ether');

    const title2 = 'Courier Title 2';
    const description2 = 'Courier Description 2';
    const value2 = web3.utils.toWei('0.2', 'ether');

    await courierManager.addCourier(title1, description1, { from: accounts[0], value: value1 });
    await courierManager.addCourier(title2, description2, { from: accounts[0], value: value2 });

    const couriers = await courierManager.getAllCouriers();

    console.log(couriers);
    assert.equal(couriers.length, 2, 'Incorrect number of couriers');
    assert.equal(couriers[0].title, title1, 'Incorrect courier title');
    assert.equal(couriers[0].description, description1, 'Incorrect courier description');
    assert.equal(couriers[1].title, title2, 'Incorrect courier title');
    assert.equal(couriers[1].description, description2, 'Incorrect courier description');
  });
});