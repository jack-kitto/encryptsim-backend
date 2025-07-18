import admin from "firebase-admin";


export class DBHandler {
  private db: admin.database.Database;

  constructor(db: admin.database.Database) {
    this.db = db;
  }

  public async getPaymentProfile(ppPublicKey: string): Promise<any> {
    const ppSnapshot = await this.db.ref(`/payment_profiles/${ppPublicKey}`).once('value');
    const pp = ppSnapshot.val()

    return pp
  }

  public async updatePPOrder(ppPublicKey: string, order_id: string): Promise<void> {
    const ppRef = this.db.ref(`/payment_profiles/${ppPublicKey}`);
    const ppSnapshot = await ppRef.once('value');
    const pp = ppSnapshot.val();

    let orderIds: string[] = [];

    if (pp && pp.orderIds) {
      orderIds = pp.orderIds;
    }

    orderIds.push(order_id);

    await ppRef.update({ orderIds });
  }
}
export class GCloudLogger {
  public logINFO(message: string) {
    console.info(message)
  }

  public logDEBUG(message: string) {
    console.debug(message)
  }

  public logERROR(message: string) {
    console.error(message)
  }
}
