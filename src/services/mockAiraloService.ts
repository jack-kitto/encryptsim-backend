import { AiraloPackage } from "@montarist/airalo-api";
import { faker } from "@faker-js/faker";

export interface MockAiraloServiceConfig {
  baseUrl?: string;
  clientId: string;
  clientSecret: string;
}

export class MockAiraloService {
  private config: MockAiraloServiceConfig;
  //@ts-ignore
  private realCountryData: any[];

  constructor(config: MockAiraloServiceConfig) {
    this.config = config;
    this.initializeRealCountryData();
  }

  private initializeRealCountryData() {
    // Based on the real API response structure
    this.realCountryData = [
      {
        slug: "united-states",
        country_code: "US",
        title: "United States",
        image: {
          width: 132,
          height: 99,
          url: "https://cdn.airalo.com/images/16291958-0de3-4142-b1ba-d2bb0aeb689c.png"
        },
        operators: [
          {
            id: 569,
            style: "light",
            gradient_start: "#0f1b3f",
            gradient_end: "#194281",
            type: "local",
            is_prepaid: false,
            title: "Change",
            esim_type: "Prepaid",
            warning: null,
            apn_type: "automatic",
            apn_value: "wbdata",
            is_roaming: true,
            info: [
              "Data-only eSIM.",
              "Rechargeable online with no expiry.",
              "Operates on T-Mobile(5G) and AT&T(LTE) networks in the United States of America."
            ],
            image: {
              width: 1035,
              height: 653,
              url: "https://cdn.airalo.com/images/feb9ef43-b097-440b-bcf5-08df9e8ff823.png"
            },
            plan_type: "data",
            activation_policy: "first-usage",
            is_kyc_verify: false,
            rechargeability: true,
            other_info: "This eSIM is for travelers to the United States. The coverage applies to all 50 states of the United States, and Puerto Rico.",
            coverages: [
              {
                name: "US",
                networks: [
                  { name: "AT&T", types: ["LTE"] },
                  { name: "T-Mobile", types: ["5G"] }
                ]
              }
            ],
            packages: [
              {
                id: "change-7days-1gb",
                type: "sim",
                price: 4.5,
                amount: 1024,
                day: 7,
                is_unlimited: false,
                title: "1 GB - 7 Days",
                data: "1 GB",
                short_info: "This eSIM doesn't come with a phone number.",
                voice: 100,
                text: 100
              },
              {
                id: "change-30days-3gb",
                type: "sim",
                price: 11,
                amount: 3072,
                day: 30,
                is_unlimited: false,
                title: "3 GB - 30 Days",
                data: "3 GB",
                short_info: "This eSIM doesn't come with a phone number.",
                voice: 100,
                text: 100
              },
              {
                id: "change-30days-5gb",
                type: "sim",
                price: 16,
                amount: 5120,
                day: 30,
                is_unlimited: false,
                title: "5 GB - 30 Days",
                data: "5 GB",
                short_info: "This eSIM doesn't come with a phone number.",
                voice: 100,
                text: 100
              }
            ],
            countries: [
              {
                country_code: "US",
                title: "United States",
                image: {
                  width: 132,
                  height: 99,
                  url: "https://cdn.airalo.com/images/16291958-0de3-4142-b1ba-d2bb0aeb689c.png"
                }
              }
            ]
          }
        ]
      },
      {
        slug: "japan",
        country_code: "JP",
        title: "Japan",
        image: {
          width: 132,
          height: 99,
          url: "https://cdn.airalo.com/images/5f795c18-e4f8-4803-804c-78dfd5dce34c.png"
        },
        operators: [
          {
            id: 665,
            style: "light",
            gradient_start: "#e94242",
            gradient_end: "#d23c3c",
            type: "local",
            is_prepaid: false,
            title: "Moshi Moshi",
            esim_type: "Prepaid",
            warning: null,
            apn_type: null,
            apn_value: null,
            is_roaming: true,
            info: [
              "4G Data-only eSIM.",
              "Rechargeable online with no expiry.",
              "Operates on the Softbank network in Japan."
            ],
            image: {
              width: 1035,
              height: 653,
              url: "https://cdn.airalo.com/images/d0b84c42-3843-42fb-83c3-bc1fff67438e.jpg"
            },
            plan_type: "data",
            activation_policy: "first-usage",
            is_kyc_verify: false,
            rechargeability: true,
            other_info: null,
            coverages: [
              {
                name: "JP",
                networks: [
                  { name: "Softbank", types: ["4G"] }
                ]
              }
            ],
            packages: [
              {
                id: "moshi-moshi-7days-1gb",
                type: "sim",
                price: 6,
                amount: 1024,
                day: 7,
                is_unlimited: false,
                title: "1 GB - 7 Days",
                data: "1 GB",
                short_info: "This eSIM doesn't come with a phone number.",
                voice: 100,
                text: 100
              },
              {
                id: "moshi-moshi-30days-3gb",
                type: "sim",
                price: 14,
                amount: 3072,
                day: 30,
                is_unlimited: false,
                title: "3 GB - 30 Days",
                data: "3 GB",
                short_info: "This eSIM doesn't come with a phone number.",
                voice: 100,
                text: 100
              }
            ],
            countries: [
              {
                country_code: "JP",
                title: "Japan",
                image: {
                  width: 132,
                  height: 99,
                  url: "https://cdn.airalo.com/images/5f795c18-e4f8-4803-804c-78dfd5dce34c.png"
                }
              }
            ]
          }
        ]
      },
      {
        slug: "united-kingdom",
        country_code: "GB",
        title: "United Kingdom",
        image: {
          width: 132,
          height: 99,
          url: "https://cdn.airalo.com/images/f63228a6-7ca3-4393-bf9b-2d134ccded0b.png"
        },
        operators: [
          {
            id: 472,
            style: "light",
            gradient_start: "#01216a",
            gradient_end: "#0033a9",
            type: "local",
            is_prepaid: false,
            title: "Uki Mobile",
            esim_type: "Prepaid",
            warning: "This eSIM doesn't come with a number.",
            apn_type: "automatic",
            apn_value: "internet",
            is_roaming: true,
            info: [
              "LTE Data-only eSIM.",
              "Rechargeable online with no expiry.",
              "Operates on the Telefonica O2 network."
            ],
            image: {
              width: 1035,
              height: 653,
              url: "https://cdn.airalo.com/images/175a0ed0-28cb-4de1-b6ba-738aa4df9acb.png"
            },
            plan_type: "data",
            activation_policy: "first-usage",
            is_kyc_verify: false,
            rechargeability: true,
            other_info: null,
            coverages: [
              {
                name: "GB",
                networks: [
                  { name: "O2-UK", types: ["LTE"] },
                  { name: "Three UK", types: ["LTE"] }
                ]
              }
            ],
            packages: [
              {
                id: "uki-mobile-7days-1gb",
                type: "sim",
                price: 5,
                amount: 1024,
                day: 7,
                is_unlimited: false,
                title: "1 GB - 7 Days",
                data: "1 GB",
                short_info: "This eSIM doesn't come with a phone number.",
                voice: 100,
                text: 100
              },
              {
                id: "uki-mobile-30days-5gb",
                type: "sim",
                price: 15,
                amount: 5120,
                day: 30,
                is_unlimited: false,
                title: "5 GB - 30 Days",
                data: "5 GB",
                short_info: "This eSIM doesn't come with a phone number.",
                voice: 100,
                text: 100
              }
            ],
            countries: [
              {
                country_code: "GB",
                title: "United Kingdom",
                image: {
                  width: 132,
                  height: 99,
                  url: "https://cdn.airalo.com/images/f63228a6-7ca3-4393-bf9b-2d134ccded0b.png"
                }
              }
            ]
          }
        ]
      }
    ];
  }

  async createOrder(params: {
    package_id: string;
    quantity: number;
    type: string;
  }) {
    await this.delay(faker.number.int({ min: 300, max: 800 }));

    return {
      data: {
        sims: Array.from({ length: params.quantity }, () => ({
          iccid: this.generateRealisticICCID(),
          qrcode: `LPA:1$${faker.internet.domainName()}$${faker.string.alphanumeric(12).toUpperCase()}`,
          qrcode_url: `https://cdn.airalo.com/qr/${faker.string.uuid()}.png`,
          created_at: new Date().toISOString(),
          direct_apple_installation_url: `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(`LPA:1$${faker.internet.domainName()}$${faker.string.alphanumeric(12)}`)}`,
        })),
      },
    };
  }

  async createTopupOrder(params: {
    package_id: string;
    iccid: string;
    description?: string;
  }) {
    await this.delay(faker.number.int({ min: 200, max: 500 }));

    const dataAmounts = ["1GB", "3GB", "5GB", "10GB", "20GB"];
    const selectedData = faker.helpers.arrayElement(dataAmounts);
    const basePrice = this.getDataPrice(selectedData);

    return {
      data: {
        id: `topup_${faker.string.uuid()}`,
        package_id: params.package_id,
        currency: "USD",
        quantity: 1,
        description: params.description || `Top-up ${selectedData}`,
        esim_type: "data",
        data: selectedData,
        price: basePrice,
        net_price: basePrice * 0.9,
      },
    };
  }

  async getSIMTopups(iccid: string) {
    await this.delay(faker.number.int({ min: 150, max: 300 }));

    const topupOptions = [
      { data: "1GB", days: 7, basePrice: 9.99 },
      { data: "3GB", days: 15, basePrice: 19.99 },
      { data: "5GB", days: 30, basePrice: 29.99 },
      { data: "10GB", days: 30, basePrice: 49.99 },
      { data: "20GB", days: 30, basePrice: 79.99 },
      { data: "Unlimited", days: 7, basePrice: 39.99, unlimited: true },
    ];

    return {
      data: topupOptions.map((option, index) => ({
        id: `topup_${option.data.toLowerCase().replace('gb', 'gb')}_${option.days}d`,
        price: option.basePrice,
        amount: option.unlimited ? "Unlimited" : option.data,
        day: option.days,
        is_unlimited: option.unlimited || false,
        title: `${option.data} - ${option.days} Days`,
        data: option.data,
        net_price: option.basePrice * 0.9,
      })),
    };
  }

  async getSIM(iccid: string) {
    await this.delay(faker.number.int({ min: 100, max: 250 }));

    return {
      data: {
        iccid: iccid,
        created_at: faker.date.recent({ days: 30 }).toISOString(),
        status: faker.helpers.arrayElement(["active", "inactive", "suspended"]),
        package_id: `pkg_${faker.string.alphanumeric(8)}`,
      },
    };
  }

  async getSIMUsage(iccid: string) {
    await this.delay(faker.number.int({ min: 150, max: 300 }));

    const usageData = [];
    const daysBack = faker.number.int({ min: 5, max: 14 });
    const totalLimit = 5120; // 5GB in MB

    for (let i = daysBack; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dailyUsage = faker.number.int({ min: 50, max: 800 });
      const remaining = Math.max(0, totalLimit - (dailyUsage * (daysBack - i + 1)));

      usageData.push({
        date: date.toISOString().split("T")[0],
        data_usage_mb: dailyUsage,
        data_limit_mb: totalLimit,
        remaining_mb: remaining,
      });
    }

    return {
      data: usageData,
    };
  }

  async getPackages(params: {
    type: "global" | "local" | "regional";
    country?: string;
  }): Promise<{ data: AiraloPackage[] }> {
    await this.delay(faker.number.int({ min: 300, max: 600 }));

    if (params.type === "global") {
      return { data: this.generateGlobalPackages() };
    }

    if (params.type === "local" && params.country) {
      const countryPackage = this.getCountryPackage(params.country);
      return { data: countryPackage ? [countryPackage] : [] };
    }

    if (params.type === "regional") {
      return { data: this.generateRegionalPackages() };
    }

    return { data: [] };
  }

  private generateGlobalPackages(): AiraloPackage[] {
    return [
      //@ts-ignore
      {
        slug: "global",
        country_code: "GLOBAL",
        title: "Global",
        image: {
          width: 132,
          height: 99,
          url: "https://cdn.airalo.com/images/global-esim.png"
        },
        operators: [
          {
            id: faker.number.int({ min: 1000, max: 9999 }),
            style: "light",
            gradient_start: "#1a365d",
            gradient_end: "#2d3748",
            type: "global",
            is_prepaid: false,
            title: "Global Connect",
            esim_type: "Prepaid",
            warning: null,
            apn_type: "automatic",
            apn_value: "globaldata",
            is_roaming: true,
            info: [
              "Global 4G/5G Data-only eSIM.",
              "Rechargeable online with no expiry.",
              "Operates on multiple networks worldwide."
            ],
            image: {
              width: 1035,
              height: 653,
              url: "https://cdn.airalo.com/images/global-operator.png"
            },
            plan_type: "data",
            activation_policy: "first-usage",
            is_kyc_verify: false,
            rechargeability: true,
            other_info: "Coverage in 190+ countries worldwide.",
            coverages: [
              {
                name: "GLOBAL",
                networks: [
                  { name: "Multiple Networks", types: ["4G", "5G"] }
                ]
              }
            ],
            packages: [
              {
                id: "global-7days-1gb",
                type: "sim",
                price: 12.99,
                amount: 1024,
                day: 7,
                is_unlimited: false,
                title: "1 GB - 7 Days",
                data: "1 GB",
                short_info: "This eSIM doesn't come with a phone number.",
                voice: 100,
                text: 100
              },
              {
                id: "global-30days-5gb",
                type: "sim",
                price: 49.99,
                amount: 5120,
                day: 30,
                is_unlimited: false,
                title: "5 GB - 30 Days",
                data: "5 GB",
                short_info: "This eSIM doesn't come with a phone number.",
                voice: 100,
                text: 100
              }
            ],
            countries: []
          }
        ]
      } as AiraloPackage
    ];
  }

  private generateRegionalPackages(): AiraloPackage[] {
    const regions = [
      {
        slug: "europe",
        title: "Europe",
        countries: ["DE", "FR", "IT", "ES", "GB"],
        operatorName: "Euro Mobile"
      },
      {
        slug: "asia-pacific",
        title: "Asia Pacific",
        countries: ["JP", "SG", "TH", "MY", "HK"],
        operatorName: "Asia Connect"
      }
    ];

    //@ts-ignore
    return regions.map(region => ({
      slug: region.slug,
      country_code: "REGIONAL",
      title: region.title,
      image: {
        width: 132,
        height: 99,
        url: `https://cdn.airalo.com/images/${region.slug}-region.png`
      },
      operators: [
        {
          id: faker.number.int({ min: 2000, max: 2999 }),
          style: "light",
          gradient_start: faker.color.rgb(),
          gradient_end: faker.color.rgb(),
          type: "regional",
          is_prepaid: false,
          title: region.operatorName,
          esim_type: "Prepaid",
          warning: null,
          apn_type: "automatic",
          apn_value: "internet",
          is_roaming: true,
          info: [
            `Regional ${region.title} Data-only eSIM.`,
            "Rechargeable online with no expiry.",
            `Operates on multiple networks across ${region.title}.`
          ],
          image: {
            width: 1035,
            height: 653,
            url: `https://cdn.airalo.com/images/${region.slug}-operator.png`
          },
          plan_type: "data",
          activation_policy: "first-usage",
          is_kyc_verify: false,
          rechargeability: true,
          other_info: `Coverage across ${region.countries.length} countries in ${region.title}.`,
          coverages: region.countries.map(countryCode => ({
            name: countryCode,
            networks: [
              { name: "Local Network", types: ["4G", "LTE"] }
            ]
          })),
          packages: [
            {
              id: `${region.slug}-7days-1gb`,
              type: "sim",
              price: faker.number.float({ min: 8.99, max: 12.99, fractionDigits: 2 }),
              amount: 1024,
              day: 7,
              is_unlimited: false,
              title: "1 GB - 7 Days",
              data: "1 GB",
              short_info: "This eSIM doesn't come with a phone number.",
              voice: 100,
              text: 100
            },
            {
              id: `${region.slug}-30days-5gb`,
              type: "sim",
              price: faker.number.float({ min: 24.99, max: 34.99, fractionDigits: 2 }),
              amount: 5120,
              day: 30,
              is_unlimited: false,
              title: "5 GB - 30 Days",
              data: "5 GB",
              short_info: "This eSIM doesn't come with a phone number.",
              voice: 100,
              text: 100
            }
          ],
          countries: region.countries.map(countryCode => ({
            country_code: countryCode,
            title: this.getCountryName(countryCode),
            image: {
              width: 132,
              height: 99,
              url: `https://cdn.airalo.com/images/${countryCode.toLowerCase()}-flag.png`
            }
          }))
        }
      ]
    } as AiraloPackage));
  }

  private getCountryPackage(countryCode: string): AiraloPackage | null {
    const realCountry = this.realCountryData.find(
      country => country.country_code.toLowerCase() === countryCode.toLowerCase()
    );

    if (realCountry) {
      return realCountry as AiraloPackage;
    }

    // Generate a realistic country package if not in real data
    return this.generateCountryPackage(countryCode);
  }

  private generateCountryPackage(countryCode: string): AiraloPackage {
    const countryName = this.getCountryName(countryCode);
    const operatorNames = this.getOperatorNames(countryCode);

    //@ts-ignore
    return {
      slug: countryName.toLowerCase().replace(/\s+/g, '-'),
      country_code: countryCode.toUpperCase(),
      title: countryName,
      image: {
        width: 132,
        height: 99,
        url: `https://cdn.airalo.com/images/${countryCode.toLowerCase()}-flag.png`
      },
      operators: [
        {
          id: faker.number.int({ min: 3000, max: 9999 }),
          style: faker.helpers.arrayElement(["light", "dark"]),
          gradient_start: faker.color.rgb(),
          gradient_end: faker.color.rgb(),
          type: "local",
          is_prepaid: false,
          title: faker.helpers.arrayElement(operatorNames),
          esim_type: "Prepaid",
          warning: faker.helpers.maybe(() => "This eSIM doesn't come with a number.", { probability: 0.3 }),
          apn_type: faker.helpers.arrayElement(["automatic", "manual", null]),
          apn_value: faker.helpers.arrayElement(["internet", "globaldata", "fastaccess"]),
          is_roaming: faker.datatype.boolean(),
          info: [
            "4G/LTE Data-only eSIM.",
            "Rechargeable online with no expiry.",
            `Operates on local networks in ${countryName}.`
          ],
          image: {
            width: 1035,
            height: 653,
            url: `https://cdn.airalo.com/images/${faker.string.uuid()}.png`
          },
          plan_type: "data",
          activation_policy: "first-usage",
          is_kyc_verify: false,
          rechargeability: faker.datatype.boolean(),
          other_info: faker.helpers.maybe(() => `Coverage throughout ${countryName}.`),
          coverages: [
            {
              name: countryCode.toUpperCase(),
              networks: [
                { name: faker.helpers.arrayElement(operatorNames), types: ["4G", "LTE"] }
              ]
            }
          ],
          packages: this.generatePackages(countryCode),
          countries: [
            {
              country_code: countryCode.toUpperCase(),
              title: countryName,
              image: {
                width: 132,
                height: 99,
                url: `https://cdn.airalo.com/images/${countryCode.toLowerCase()}-flag.png`
              }
            }
          ]
        }
      ]
    } as AiraloPackage;
  }

  private generatePackages(countryCode: string) {
    const basePrice = this.getCountryBasePrice(countryCode);
    const packageOptions = [
      { data: "1GB", amount: 1024, days: 7, multiplier: 1 },
      { data: "3GB", amount: 3072, days: 30, multiplier: 2.2 },
      { data: "5GB", amount: 5120, days: 30, multiplier: 3.5 },
      { data: "10GB", amount: 10240, days: 30, multiplier: 6 },
    ];

    return packageOptions.map(pkg => ({
      id: `${countryCode.toLowerCase()}-${pkg.days}days-${pkg.data.toLowerCase()}`,
      type: "sim",
      price: parseFloat((basePrice * pkg.multiplier).toFixed(2)),
      amount: pkg.amount,
      day: pkg.days,
      is_unlimited: false,
      title: `${pkg.data} - ${pkg.days} Days`,
      data: pkg.data,
      short_info: faker.helpers.maybe(() => "This eSIM doesn't come with a phone number.", { probability: 0.8 }),
      voice: faker.helpers.maybe(() => 100, { probability: 0.7 }),
      text: faker.helpers.maybe(() => 100, { probability: 0.7 })
    }));
  }

  private generateRealisticICCID(): string {
    // Format: 89 + country code + network code + subscriber number + check digit
    const countryCode = faker.helpers.arrayElement(["001", "310", "440", "234", "208"]);
    const networkCode = faker.string.numeric(2);
    const subscriberNumber = faker.string.numeric(12);
    return `89${countryCode}${networkCode}${subscriberNumber}`;
  }

  private getDataPrice(data: string): number {
    const prices = {
      "1GB": 9.99,
      "3GB": 19.99,
      "5GB": 29.99,
      "10GB": 49.99,
      "20GB": 79.99
    };
    //@ts-ignore
    return prices[data] || 9.99;
  }

  private getCountryBasePrice(countryCode: string): number {
    const priceTiers = {
      "US": 4.5, "CA": 7.5, "GB": 5.0, "DE": 5.0, "FR": 5.0,
      "JP": 6.0, "SG": 7.5, "AU": 4.5, "IT": 4.5, "ES": 4.5,
      "TH": 9.9, "MY": 4.5, "HK": 5.0, "CN": 6.0, "TR": 4.5
    };
    //@ts-ignore
    return priceTiers[countryCode] || faker.number.float({ min: 4.5, max: 12.0, fractionDigits: 2 });
  }

  private getCountryName(countryCode: string): string {
    const countries = {
      "US": "United States", "CA": "Canada", "GB": "United Kingdom",
      "DE": "Germany", "FR": "France", "IT": "Italy", "ES": "Spain",
      "JP": "Japan", "SG": "Singapore", "AU": "Australia", "TH": "Thailand",
      "MY": "Malaysia", "HK": "Hong Kong", "CN": "China", "TR": "Turkey",
      "MX": "Mexico", "BR": "Brazil", "IN": "India", "KR": "South Korea"
    };
    //@ts-ignore
    return countries[countryCode.toUpperCase()] || faker.location.country();
  }

  private getOperatorNames(countryCode: string): string[] {
    const operators = {
      "US": ["Verizon", "AT&T", "T-Mobile", "Change"],
      "GB": ["O2", "EE", "Three", "Vodafone", "Uki Mobile"],
      "DE": ["Deutsche Telekom", "Vodafone", "O2", "Hallo! Mobil"],
      "FR": ["Orange", "SFR", "Bouygues", "Bonbon Mobile"],
      "JP": ["NTT Docomo", "SoftBank", "KDDI", "Moshi Moshi"],
      "SG": ["Singtel", "StarHub", "M1", "Connect Lah!"],
      "AU": ["Telstra", "Optus", "Vodafone", "Yes! Go!"]
    };
    //@ts-ignore
    return operators[countryCode.toUpperCase()] || [
      faker.company.name() + " Mobile",
      faker.company.name() + " Telecom",
      faker.company.name() + " Connect"
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
