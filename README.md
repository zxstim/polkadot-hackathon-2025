> BELOW IS THE TEMPLATE FOR THE HACKATHON SUBMISSION

# **Project Name**  
ZeKae Protocol

## **Team Members**  
- **ZxStim** - Builder
- **Contact Information:** zxstim@gmail.com / zxstim

## Development Guidelines
- Fork the UI template: https://github.com/openguild-labs/dotui
- Follow the Polkadot brand hub: https://polkadot.com/community/brand-hub

## Requirement Checklist

Hackathon submissions **MUST** follow these rules to reach the entry requirements of the hackathon. The project can be quality, but if these requirements are not satisfied or rules are violated, it will be disqualified from the competition.

**🔴 Note: These requirements are applied for all track submission.** 

- [x] Because projects will be developed on Polkadot Hub (https://contracts.polkadot.io/), all projects UI need to follow the [design guidelines](https://polkadot.com/community/brand-hub) of Polkadot.
- [x] All projects must be **open-source** and the organizer team has the authority to fork the project codebase and organized under [the organizer’s Github organization - OpenGuild Labs](https://github.com/openguild-labs). 
    - These archived codebase is for ***the purpose of common good projects and will not be used for commercial purpose**.*
    - Only the submitted codebase for final judgement will be archived.
- [x] The hackathon is open for innovation on top of existing open-source codebase. However, project that forks from the existing open-source projects on the market with more than **70%** codebase similarities will be disqualified immediately. 
- [x] All project team members must verify their identity on OpenGuild Discord channel (which takes 2 minutes) following the guide [**OpenGuild - Discord Guidelines**](https://handbook.openguild.wtf/general-information/guidelines/discord-guidelines)
- [x] Projects does not need to be developed during the hackathon, it can be past hackathon projects as far as it is quality and ***had not been granted by the past hackathon or the ecosystem fund yet.*** (from **Polkadot** ecosystem under one year)
- [x] Valid commit history of the projects are required for this hackathon as well. It is a proof of contribution of your team to the projects. 
    - The commit history must indicates the contribution of the team during the hackathon. Only the contribution made during the hackathon is counted towards the final score.

## **Project Description**  
### What does your project do?  
ZeKae Protocol is a protocol that allows users to mint yield bearing stablecoins leaveraging Liquid Staking Tokens (LST).

### Inspiration  
I want to empower Liquid Staking Tokens like those provided by Bifrost to be used as collateral for stablecoins.

## **Technical Stack**  
- **Languages and Frameworks:**  
    - Next.js
    - Tailwind CSS
    - Lucide icons
    - ShadCN UI
    - RainbowKit
    - Wagmi
    - Viem
    - Jotai
    - Tanstack React Query
    - Vaul
    - Zod
    - React Hook Form
    - Solidity (Foundry)
- **Blockchain/Protocol:**  
    - Asset Hub (temporarily on Moonbeam until Asset Hub is ready)
- **Tools and APIs:** 
    - None

## **Features**  
- **Feature 1:** Deposit and withdraw LST from Vault used as collateral for stablecoins
- **Feature 2:** Mint stablecoins using LST as collateral
- **Feature 3:** Liquidate LST from Vault when collateral ratio is below threshold
- **Feature 4:** An oracle for the price of the underlying asset and exchange rate

## **How It Works**  
### Architecture  
#### LST token contract
An ERC20 token contract that is representative of the LST that will be available on Asset Hub.

#### zUSD contract
An ERC20 token contract that is a stablecoin and has the vault as the owner (the only one who can mint and burn).

#### ZeKaeVault contract
A contract that allows users to deposit LST, withdraw LST, mint zUSD and burn zUSD. Additionally, it has a liquidation function that allows the liquidators to liquidate LST from the user when the collateral ratio is below threshold. The collateral ratio is set at 150% for now.

Revelant functions:
- `deposit(uint256 amount)`
- `withdraw(uint256 amount)`
- `mint(uint256 amount)`
- `burn(uint256 amount)`
- `liquidate(address user)`

#### SimpleMockOracle contract
A simple mock oracle contract that returns the exchange rate between the underlying asset and the LST, the price of the underlying asset and the price of the LST.

Relevant functions:
- `getExchangeRate()`
- `getPriceOfUnderlyingAsset()`
- `latestAnswer()`

### Demo Instructions
Please use Moonbeam Alpha (Moonbeam Testnet) to test the demo. Asset Hub had issues preventing me from deploying some core contracts.
https://youtu.be/TmQpZLjYp2s

## **Challenges**  
### What challenges did you face?  
- Mostly just Asset Hub RPC stability issues.

## **Future Development**  
### What’s next for your project?  
- Add more features like flash loans, more features, etc.

## **Submission Details**  
- **GitHub Repository:**  
    - https://github.com/zxstim/zekaehq/zekae-contracts
    - https://github.com/zxstim/zekaehq/zekae-dapp
- **Live Demo:**  
    - https://zekae.com
- **Documentation:**  
    - Read more below
- **Presentation Slides:**  
    - https://youtu.be/TmQpZLjYp2s

## **Acknowledgments**  
- Partially inspired by Lybra Finance but with a really simple design.


## **Documentation**

The protocol works as follows:

1. User deposits LST into the vault.
2. User mints zUSD using the LST as collateral.
3. User can withdraw LST from the vault.
4. Based on the price of the underlying asset, the exchange rate between the underlying asset and the LST (calculated by the LST provider), the oracle allows the vault to fetch the price of the LST to calculate the maximum amount of zUSD that can be minted based on the user LST deposit.
5. User can mint and burn zUSD within the maximum amount.
6. The vault will allow liquidators to liquidate the user's LST deposit if the collateral ratio is below the threshold, this happens when the price of the underlying asset drops significantly (say during bear market).
7. The liquidator will pay back the vault the amount of zUSD that was minted by the user and receive the user's LST deposit.
