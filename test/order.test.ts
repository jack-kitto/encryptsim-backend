import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000'; // Assuming your app runs on this port

describe('/order integration test', () => {

  it('should process an order and receive payment eventually', async () => {
    // --- START CUSTOM REQUEST BODY ---
    // Replace with your actual test data for the /order POST request
    const customOrderRequestBody = {
      ppPublicKey: 'Fip7DsE6uA9tgQcatYkWQEYfyCmcoYPSrCoTPr2SbE76', // Replace with a valid test public key
      quantity: 1,
      package_id: 'asialink-3days-500mb', // Replace with a valid test package ID
      package_price: '1.53', // Replace with a valid test package price (as a string)
    };
    // --- END CUSTOM REQUEST BODY ---

    // 1. Post the order
    const postOrderResponse = await fetch(`${API_URL}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customOrderRequestBody),
    });

    expect(postOrderResponse.ok).toBe(true);
    const orderResponseData = await postOrderResponse.json();
    const orderId = orderResponseData.orderId;
    expect(orderId).toBeDefined();

    console.log(`Order placed with ID: ${orderId}`);
    console.log('Polling for payment status...');

    // 2. Poll for order status until payment is received
    const pollingInterval = 5000; // Poll every 5 seconds
    const pollingTimeout = 10 * 60 * 1000; // 10 minutes timeout
    const startTime = Date.now();
    let orderStatus = null;

    while (Date.now() - startTime < pollingTimeout) {
      const getOrderResponse = await fetch(`${API_URL}/order/${orderId}`);

      if (getOrderResponse.status === 204) {
        console.log('Order information not yet available (204), waiting...');
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        continue;
      } else if (getOrderResponse.status === 200) {
        orderStatus = await getOrderResponse.json();
        console.log('Order status received (200):', orderStatus);

        if (orderStatus.paymentReceived && orderStatus.sim) {
          console.log('Payment received and sim available!');
          break; // Exit loop if payment is received
        }
      } else {
        // Handle unexpected status codes
        console.error(`Unexpected status code: ${getOrderResponse.status}`);
        // Depending on requirements, you might want to fail the test here
        // throw new Error(`Unexpected status code: ${getOrderResponse.status}`);
        break; // Exit loop on unexpected status
      }

      console.log('Payment not yet received, waiting...');
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }

    // 3. Assert the final status
    expect(orderStatus).toBeDefined();
    expect(orderStatus?.orderId).toBe(orderId);
    expect(orderStatus?.paymentReceived).toBe(true);
    expect(orderStatus?.sim).toBeDefined();
    // You might want to add more assertions based on your expected order status
    // e.g., expect(orderStatus?.qrCode).toBeDefined();

    console.log('Integration test for /order completed successfully.');
    console.log('Final Order Sim:', orderStatus.sim);

  }, 11 * 60 * 1000); // Set Jest timeout for the test case to be longer than the polling timeout
});