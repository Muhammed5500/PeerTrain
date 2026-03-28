# PeerTrain: Peer Prediction ile Merkeziyetsiz AI Egitim Dogrulama Protokolu
## Monad Hackathon Projesi — Detayli Teknik Rapor

---

# ICINDEKILER

1. [Yonetici Ozeti](#1-yonetici-ozeti)
2. [Problem Tanimi](#2-problem-tanimi)
3. [Mevcut Cozumler ve Eksiklikleri](#3-mevcut-cozumler-ve-eksiklikleri)
4. [PeerTrain Cozumu: Peer Prediction](#4-peertrain-cozumu-peer-prediction)
5. [Peer Prediction Mekanizmasi — Detayli Aciklama](#5-peer-prediction-mekanizmasi--detayli-aciklama)
6. [Teknik Mimari](#6-teknik-mimari)
7. [Smart Contract Tasarimi](#7-smart-contract-tasarimi)
8. [Egitim Akisi (Uctan Uca)](#8-egitim-akisi-uctan-uca)
9. [Saldiri Vektorleri ve Savunmalar](#9-saldiri-vektorleri-ve-savunmalar)
10. [Neden Monad?](#10-neden-monad)
11. [Teknoloji Stack'i](#11-teknoloji-stacki)
12. [Deploy Plani](#12-deploy-plani)
13. [Hackathon Demo Senaryosu](#13-hackathon-demo-senaryosu)
14. [Rekabet Analizi](#14-rekabet-analizi)
15. [Yenilikcilik (Novelty) Analizi](#15-yenilikcilik-novelty-analizi)
16. [Gelecek Vizyonu](#16-gelecek-vizyonu)

---

# 1. YONETICI OZETI

**PeerTrain**, merkeziyetsiz AI model egitiminde node'larin durust hesaplama yapip yapmadigini **peer prediction mekanizmasi** ile dogrulayan bir protokoldur.

**Temel tez:** AI model egitimi artik tek bir sirketin tekelinde olmak zorunda degil. Yuzlerce bagimsiz node birlikte egitim yapabilir. Ama guvensiz ortamda her node'un durust calistigini dogrulamak gerekir. Mevcut cozumler ya ozel donanim gerektiriyor (TEE) ya da subjektif validatorlere guveniyor (Bittensor). PeerTrain ucuncu bir yol sunuyor: **saf matematik**.

**Nasil calisir:**
- Node'lara ortak bir "sinav seti" verilir
- Ayni veri uzerinde yapilan hesaplamalar karsilastirilir
- Peer prediction mekanizmasi, ground truth olmadan sahteciligi tespit eder
- Durust node'lar odullendirilir, sahteciler stake kaybeder
- Tum settlement on-chain'de (Monad) gerceklesir

**Neden yeni:** Peer prediction'i AI training gradient verification'a uygulayan bilinen bir proje veya akademik calismayok. Bu, donanim gerektirmeyen, oracle'siz, permissionless ve game-theoretically sound bir yaklasim.

---

# 2. PROBLEM TANIMI

## 2.1 Merkeziyetsiz AI Egitimi Nedir?

Geleneksel AI egitimi merkezi:

```
OpenAI / Google / Meta
    |
    v
Tek veri merkezi, binlerce GPU
    |
    v
Model egitilir
    |
    v
Sirket modeli sahiplenir
```

Merkeziyetsiz AI egitimi:

```
Node A (Istanbul)  Node B (Berlin)  Node C (Tokyo)  Node D (NYC)
    |                   |                |                |
    v                   v                v                v
Her biri verinin bir parcasini isler
    |                   |                |                |
    └───────────────────┴────────────────┴────────────────┘
                              |
                              v
                      Gradient'ler toplanir
                              |
                              v
                      Model guncellenir
```

Avantajlari:
- Tek noktali arizaya karsi dayaniklilik
- Maliyet paylasimi (GPU'lar pahali)
- Sansur direnci
- Demokratik erisim

## 2.2 Guven Problemi

Merkezi egitimde guven basit: tek kurulusu guvenirsn (veya guvenmezsin).

Merkeziyetsiz egitimde node'lar:
- **Anonim** olabilir
- **Rakip** olabilir
- **Kotu niyetli** olabilir

Bir node su seyleri yapabilir:
- **Hic hesaplamamak** — random sayi gondermek (kaynak tasarrufu)
- **Yanlis hesaplamak** — bozuk gradient gondermek (sabotaj)
- **Bias eklemek** — modeli yonlendirmek (manipulasyon)

Ve sen bunu **bilemezsin** cunku:
- Ground truth gradient'i kimse bilmiyor (hesaplamadan once)
- Her node farkli veri parcasiyla calistiginden sonuclar zaten farkli
- Denetim icin merkezi bir otorite yok

## 2.3 Problemin Boyutu

| Metrik | Deger |
|--------|-------|
| Frontier model egitim maliyeti | 100M$ — 1B$+ |
| Kompromize olmus eğitimin etkisi | Modelin tum ciktilari guvenilmez |
| AI ajanlarinin karar alanlari | Finansal islemler, tibbi oneriler |
| Regulasyon | EU AI Act seffaflik gerektiriyor |

Yani bu sadece teknik bir problem degil — ekonomik, guvenlik ve yasal bir problem.

---

# 3. MEVCUT COZUMLER VE EKSIKLIKLERI

## 3.1 Trusted Execution Environments — TEE (0G Yaklasimi)

**Nasil calisir:**
- Islemcinin sifreli, izole bir bolgesinde (Intel SGX, AMD SEV) kod calistirilir
- Makine sahibi bile hesaplamaya mudahale edemez
- Donanim kriptografik attestation uretir
- 3. taraflar bu kaniti dogrulayabilir

**Avantajlar:**
- Deterministik dogrulama
- Insan davranisina guven gerekmiyor
- Kriptografik kanit

**Dezavantajlar:**
- **Ozel donanim gerekli** — Intel SGX/TDX, AMD SEV-SNP
- **Donanim ureticisine bagimlilik** — Intel/AMD guvenilmeli
- **Maliyet** — TEE destekli sunucular daha pahali
- **Permissionless degil** — herkes katilaamaz
- **Side-channel saldirilari** — SGX'e karsi basarili saldirilar belgelenmis (Spectre, Meltdown varyantlari)

## 3.2 Ekonomik Tesvik Uyumu (Bittensor Yaklasimi)

**Nasil calisir:**
- Validatorler egitim katkilarini puanliyor
- Kotu aktorler stake ettikleri TAO tokenlerini kaybediyor
- Oyun teorisi: hile maliyeti > hile getirisi

**Avantajlar:**
- Olceklenebilir
- Ozel donanim gerektirmez

**Dezavantajlar:**
- **Validatorlere guven gerekli** — validatorler subjektif puanliyor
- **Rasyonel aktor varsayimi** — irrasyonel veya ideolojik saldirganlar icin calismaz
- **Ince manipulasyon** — %95 dogru + %5 bias'li gradient validasyonu gecebilir
- **Validatör collusion** — validatorler anlasabilir

## 3.3 Zero-Knowledge Proofs (ZK Yaklasimi)

**Nasil calisir:**
- Her hesaplama adimi icin ZK proof uretilir
- Proof dogrulama ucuz, uretme pahali

**Dezavantajlar:**
- **Computationally prohibitive** — gradient hesaplamasi icin ZK proof uretmek mevcut teknolojiyle pratik degil
- **Gecikme** — proof uretimi cok yavas

## 3.4 Bosluk

```
                    Donanim     Guven        Permissionless   Maliyet
                    Gereksinimi Varsayimi
TEE (0G)            Evet        Donanim      Hayir            Yuksek
                                ureticisi
Ekonomik (Bittensor) Hayir      Validatorler Kismi            Dusuk
                                + rasyonellik
ZK Proofs           Hayir       Yok          Evet             Cok yuksek

PeerTrain           Hayir       Yok          Evet             Dusuk
```

PeerTrain bu tabodaki tek bos kutuyu dolduruyor: **donanimsiz, guven varsayimsiz, permissionless ve dusuk maliyetli.**

---

# 4. PEERTRAIN COZUMU: PEER PREDICTION

## 4.1 Peer Prediction Nedir?

Peer prediction, **ground truth bilinmeden** raporlarin durust olup olmadigini tespit eden bir mekanizma ailesidir.

**Temel prensip:** Ayni seyi bagimsiz olarak gozlemleyen durst raporcularin cevaplari arasinda tahmin edilebilir bir korelasyon vardir. Hile yapanlar bu korelasyonu bozar.

**Gunluk hayat analojisi:**

```
Bir filmi 100 kisi izledi.
"Film nasıldi?" diye soruyorsun.

85 kisi: "Guzeldi"
10 kisi: "Fenaydı" (farkli zevkler - normal)
5 kisi: "Film uzayda geciyordu" (filmi izlememisler, uydurmalar)

Ground truth'u sen bilmiyorsun (filmi izlemedin).
Ama 5 kisinin yalan soyledigini tespit edebilirsin
cunku cevaplari digerleriyle korelasyon gostermiyor.
```

## 4.2 Akademik Temel

Peer prediction literaturunun temel mekanizmalari:

| Mekanizma | Yazar | Yil | Temel Fikir |
|-----------|-------|-----|-------------|
| Peer Prediction | Miller, Resnick, Zeckhauser | 2005 | Raporlari birbirine karsi skorla |
| Bayesian Truth Serum | Prelec | 2004 | "Surprisingly popular" cevabi odulendir |
| DRPM | Dasgupta & Ghosh | 2013 | Binary sinyaller icin basit mekanizma |
| Peer Truth Serum | Radanovic & Faltings | 2013 | Continuous sinyaller icin genisleme |

PeerTrain, bu mekanizmalarin **ilk kez AI training verification'a** uygulanmasidir.

## 4.3 Neden AI Training Icin Uygun?

AI gradient verification ve peer prediction arasindaki esdusumler:

```
Peer Prediction Dunyasi          AI Training Dunyasi
─────────────────────────        ──────────────────────
Raporcu                    =     Training node
Sinyal (gozlem)            =     Hesaplanan gradient
Ground truth               =     "Dogru" gradient (bilinmiyor)
Durst raporlama            =     Gercek hesaplama yapma
Yalan raporlama            =     Sahte/random gradient gonderme
Peer karsilastirma         =     Overlap set uzerinde gradient karsilastirma
Skor                       =     Node guvenilirlik puani
Odul/ceza                  =     Token reward/slash
```

Esdusumler bire bir. Bu bir zorlama degil — peer prediction tam olarak bu tip problemler icin tasarlandi.

---

# 5. PEER PREDICTION MEKANIZMASI — DETAYLI ACIKLAMA

## 5.1 Overlap Set (Sinav Seti) Mekanizmasi

Her egitim round'unda veri su sekilde dagitilir:

```
Toplam egitim verisi: D = {d1, d2, d3, ..., dn}

Her round icin:
  - D_shared: Rastgele secilen kucuk bir alt kume (%5-10)
  - D_private_i: Node i'ye ozel veri parcasi

Node A alir: D_private_A + D_shared
Node B alir: D_private_B + D_shared
Node C alir: D_private_C + D_shared
Node D alir: D_private_D + D_shared

D_shared her round degisir (rastgele seed on-chain'den)
```

**Neden overlap set?**
- Ayni veri + ayni model + ayni hesaplama = ayni gradient (yaklaşik)
- Durust node'larin overlap set gradient'leri korelasyon gosterir
- Sahte node'un gradient'i korelasyon gostermez

## 5.2 Gradient Hesaplama

Her node iki gradient hesaplar:

```python
# Her node'un yaptigi hesaplama
def compute_round(model, private_data, shared_data):

    # 1. Ozel veri gradient'i — model egitimi icin kullanilir
    g_private = compute_gradient(model, private_data)

    # 2. Sinav seti gradient'i — dogrulama icin kullanilir
    g_shared = compute_gradient(model, shared_data)

    return g_private, g_shared
```

## 5.3 Benzerlik Olcumu

Gradient'ler arasindaki benzerlik **cosine similarity** ile olculur:

```
cosine_similarity(a, b) = (a . b) / (||a|| * ||b||)

Deger araligi: [-1, 1]
  1.0  = tamamen ayni yon (durst)
  0.0  = ilgisiz (muhtemelen sahte)
 -1.0  = tam zit yon (kesinlikle sahte/sabotaj)
```

**Neden cosine similarity?**
- Gradient buyuklugunden bagimsiz — sadece yon karsilastirir
- Yuksek boyutlu uzaylarda etkili
- Hesaplamasi hizli: O(d) where d = gradient boyutu

## 5.4 Peer Prediction Skorlama

### Basit Versiyon (Hackathon icin yeterli):

```
N node var. Her node'un overlap set gradient'i: g_shared_i

Node i'nin skoru:

  score(i) = (1 / (N-1)) * SUM_j≠i [ cosine_similarity(g_shared_i, g_shared_j) ]

Yani: Node i'nin gradient'inin diger tum node'larin gradient'leriyle
      ortalama benzerlik puani.
```

**Ornek hesaplama:**

```
4 node: A (durst), B (durst), C (durst), D (sahte)

g_shared_A = [0.23, -0.41, 0.87, 0.12, -0.55]
g_shared_B = [0.25, -0.39, 0.85, 0.14, -0.53]  # durst — A'ya yakin
g_shared_C = [0.22, -0.43, 0.88, 0.11, -0.56]  # durst — A ve B'ye yakin
g_shared_D = [0.91, 0.12, -0.55, 0.44, 0.33]   # sahte — tamamen farkli

Cosine similarities:
  sim(A, B) = 0.998   (cok yakin — ikisi de durst)
  sim(A, C) = 0.999   (cok yakin — ikisi de durst)
  sim(A, D) = -0.212  (zit — D sahte)
  sim(B, C) = 0.997   (cok yakin — ikisi de durst)
  sim(B, D) = -0.189  (zit — D sahte)
  sim(C, D) = -0.224  (zit — D sahte)

Skorlar:
  score(A) = (0.998 + 0.999 + (-0.212)) / 3 = 0.595
  score(B) = (0.998 + 0.997 + (-0.189)) / 3 = 0.602
  score(C) = (0.999 + 0.997 + (-0.224)) / 3 = 0.591
  score(D) = ((-0.212) + (-0.189) + (-0.224)) / 3 = -0.208

Siralama: B > A > C >> D
Sonuc: A, B ve C odullendirilir, D cezalandirilir.
```

### Gelismis Versiyon (Production icin):

```
Tam peer prediction (MTS mekanizmasi):

1. Her node iki sey gonderir:
   - g_shared (kendi gradient'i — sinyal raporu)
   - g_predicted (diger node'larin gradient'inin tahmini)

2. Skorlama:
   score(i) = a * agreement(g_shared_i, peers' predictions about i)
            + b * accuracy(g_predicted_i, peers' actual signals)

   a, b = agirlik parametreleri

3. Bu mekanizmada durust raporlama STRICTLY DOMINANT STRATEGY.
   Yani sadece rasyonel degil — baska hicbir strateji daha iyi degil.
```

## 5.5 Threshold ve Settlement

```
threshold = 0.2 (ayarlanabilir parametre)

Her round sonunda:
  score(i) >= threshold  →  REWARD (stake'e oranli odul)
  score(i) <  threshold  →  SLASH  (stake'ten kesinti)

Slash miktari > reward miktari (asimetrik)
  → Hile basarisiz olursa cok pahali
  → Hile basarili olma ihtimali dusuk (binlerce node)
  → Beklenen deger: hile yapmamak > hile yapmak
```

---

# 6. TEKNIK MIMARI

## 6.1 Sistem Diyagrami

```
┌────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                       │
│                                                            │
│   ┌──────────┐  ┌──────────────┐  ┌───────────────────┐   │
│   │ Node     │  │ Score        │  │ Transaction       │   │
│   │ Dashboard│  │ Leaderboard  │  │ Explorer          │   │
│   └──────────┘  └──────────────┘  └───────────────────┘   │
└────────────────────────┬───────────────────────────────────┘
                         │ REST API / WebSocket
┌────────────────────────┴───────────────────────────────────┐
│                   COORDINATOR (Railway)                     │
│                                                            │
│   ┌───────────────┐  ┌────────────────┐  ┌─────────────┐  │
│   │ Data          │  │ Gradient       │  │ PP Scoring  │  │
│   │ Distribution  │  │ Aggregation    │  │ Engine      │  │
│   │ Engine        │  │ Service        │  │             │  │
│   └───────┬───────┘  └───────┬────────┘  └──────┬──────┘  │
│           │                  │                   │         │
│   ┌───────┴──────────────────┴───────────────────┴──────┐  │
│   │              Chain Interaction Layer                  │  │
│   │              (web3.py / Monad RPC)                   │  │
│   └──────────────────────┬──────────────────────────────┘  │
└──────────────────────────┼─────────────────────────────────┘
           ┌───────────────┼───────────────┐───────────────┐
           │               │               │               │
     ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
     │  Node A   │  │  Node B   │  │  Node C   │  │  Node D   │
     │  (honest) │  │  (honest) │  │  (honest) │  │  (cheater)│
     │           │  │           │  │           │  │           │
     │  PyTorch  │  │  PyTorch  │  │  PyTorch  │  │  Random   │
     │  gradient │  │  gradient │  │  gradient │  │  gradient │
     └───────────┘  └───────────┘  └───────────┘  └───────────┘

┌────────────────────────────────────────────────────────────┐
│                    MONAD TESTNET                            │
│                                                            │
│   ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│   │ NodeRegistry │  │ StakeVault   │  │ ScoringEngine  │  │
│   │ .sol         │  │ .sol         │  │ .sol           │  │
│   │              │  │              │  │                │  │
│   │ - register() │  │ - stake()    │  │ - submitScore()│  │
│   │ - getNodes() │  │ - slash()    │  │ - distribute() │  │
│   │ - remove()   │  │ - reward()   │  │ - getScores()  │  │
│   └──────────────┘  └──────────────┘  └────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## 6.2 Bilesen Detaylari

### Frontend (Dashboard)
- **Teknoloji:** Next.js + React
- **Deploy:** Vercel (ucretsiz)
- **Gorev:** Gercek zamanli egitim durumu, node skorlari, on-chain tx'leri gostermek
- **Veri kaynagi:** Coordinator API + Monad RPC

### Coordinator (Backend)
- **Teknoloji:** Python + FastAPI
- **Deploy:** Railway (ucretsiz tier)
- **Gorevleri:**
  1. Egitim verisini node'lara dagitmak
  2. Overlap set'leri rastgele secmek
  3. Gradient'leri toplamak
  4. Peer prediction skorlarini hesaplamak
  5. Sonuclari on-chain'e yazmak

### Node'lar (Training Workers)
- **Teknoloji:** Python + PyTorch
- **Deploy:** Railway (ayni sunucuda ayri process'ler)
- **Gorevleri:**
  1. Coordinator'dan veri almak
  2. PyTorch ile gradient hesaplamak
  3. Gradient'leri coordinator'a gondermek

### Smart Contracts (Monad)
- **Teknoloji:** Solidity
- **Deploy:** Monad Testnet
- **3 kontrat:**
  - `NodeRegistry.sol` — Node kayit ve yonetimi
  - `StakeVault.sol` — Stake yatirma, slash, reward
  - `ScoringEngine.sol` — Skor kaydi ve dagilim

---

# 7. SMART CONTRACT TASARIMI

## 7.1 NodeRegistry.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract NodeRegistry {
    struct Node {
        address owner;
        uint256 stakeAmount;
        uint256 reputation;
        bool isActive;
        uint256 registeredAt;
    }

    mapping(address => Node) public nodes;
    address[] public activeNodes;
    uint256 public minimumStake;

    event NodeRegistered(address indexed node, uint256 stake);
    event NodeRemoved(address indexed node, string reason);

    function register() external payable {
        require(msg.value >= minimumStake, "Insufficient stake");
        require(!nodes[msg.sender].isActive, "Already registered");

        nodes[msg.sender] = Node({
            owner: msg.sender,
            stakeAmount: msg.value,
            reputation: 100,
            isActive: true,
            registeredAt: block.timestamp
        });

        activeNodes.push(msg.sender);
        emit NodeRegistered(msg.sender, msg.value);
    }

    function getActiveNodes() external view returns (address[] memory) {
        return activeNodes;
    }

    function getNodeCount() external view returns (uint256) {
        return activeNodes.length;
    }
}
```

## 7.2 StakeVault.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract StakeVault {
    mapping(address => uint256) public stakes;
    address public scoringEngine;

    event Staked(address indexed node, uint256 amount);
    event Slashed(address indexed node, uint256 amount);
    event Rewarded(address indexed node, uint256 amount);

    modifier onlyScoringEngine() {
        require(msg.sender == scoringEngine, "Only scoring engine");
        _;
    }

    function stake() external payable {
        stakes[msg.sender] += msg.value;
        emit Staked(msg.sender, msg.value);
    }

    function slash(address node, uint256 amount) external onlyScoringEngine {
        require(stakes[node] >= amount, "Insufficient stake");
        stakes[node] -= amount;
        emit Slashed(node, amount);
    }

    function reward(address node, uint256 amount) external onlyScoringEngine {
        stakes[node] += amount;
        emit Rewarded(node, amount);
    }

    function getStake(address node) external view returns (uint256) {
        return stakes[node];
    }
}
```

## 7.3 ScoringEngine.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./StakeVault.sol";
import "./NodeRegistry.sol";

contract ScoringEngine {
    StakeVault public vault;
    NodeRegistry public registry;

    struct RoundResult {
        uint256 roundId;
        uint256 timestamp;
        mapping(address => int256) scores;
        bool settled;
    }

    uint256 public currentRound;
    int256 public threshold = 200; // 0.200 * 1000 (fixed point)
    uint256 public slashRate = 5;  // slash orani (%)
    uint256 public rewardRate = 2; // odul orani (%)

    mapping(uint256 => mapping(address => int256)) public roundScores;

    event RoundSettled(uint256 indexed roundId, uint256 nodeCount);
    event NodeSlashed(uint256 indexed roundId, address indexed node, int256 score);
    event NodeRewarded(uint256 indexed roundId, address indexed node, int256 score);

    function submitRoundScores(
        address[] calldata nodeAddresses,
        int256[] calldata scores
    ) external {
        require(nodeAddresses.length == scores.length, "Length mismatch");

        currentRound++;

        for (uint256 i = 0; i < nodeAddresses.length; i++) {
            address node = nodeAddresses[i];
            int256 score = scores[i];

            roundScores[currentRound][node] = score;

            uint256 stakeAmount = vault.getStake(node);

            if (score < threshold) {
                // SLASH — dusuk skor, muhtemelen sahte gradient
                uint256 slashAmount = (stakeAmount * slashRate) / 100;
                vault.slash(node, slashAmount);
                emit NodeSlashed(currentRound, node, score);
            } else {
                // REWARD — yuksek skor, durst hesaplama
                uint256 rewardAmount = (stakeAmount * rewardRate) / 100;
                vault.reward(node, rewardAmount);
                emit NodeRewarded(currentRound, node, score);
            }
        }

        emit RoundSettled(currentRound, nodeAddresses.length);
    }
}
```

---

# 8. EGITIM AKISI (UCTAN UCA)

## 8.1 Baslangic (Bir Kere)

```
1. Smart contract'lar Monad testnet'e deploy edilir
2. Node'lar register() ile kaydolur
3. Her node stake() ile token yatirir
4. Coordinator baslatilir, MNIST verisi yuklenir
5. Frontend canli hale gelir
```

## 8.2 Her Egitim Round'u

```
Round N Basladi
│
├─ ADIM 1: Veri Dagitimi
│  Coordinator:
│  - On-chain random seed ile overlap set secer
│  - Her node'a ozel batch + overlap set gonderir
│
├─ ADIM 2: Gradient Hesaplama
│  Her node:
│  - PyTorch ile model uzerinde forward pass
│  - Loss hesapla
│  - Backward pass ile gradient hesapla
│  - g_private ve g_shared uret
│  - Her ikisini coordinator'a gonder
│
├─ ADIM 3: Peer Prediction Skorlama
│  Coordinator:
│  - Tum g_shared gradient'lerini toplar
│  - Her cift arasinda cosine similarity hesaplar
│  - Her node'un ortalama similarity skorunu hesaplar
│  - Threshold'a gore reward/slash belirler
│
├─ ADIM 4: On-Chain Settlement
│  Coordinator:
│  - submitRoundScores() cagrisini Monad'a gonderir
│  - Smart contract otomatik slash/reward yapar
│  - Event'ler emit edilir
│
├─ ADIM 5: Model Guncelleme
│  Coordinator:
│  - Sadece threshold'u gecen node'larin g_private'larini alir
│  - Sahtecilerin gradient'lerini dislar
│  - Gecerli gradient'leri aggregate eder (FedAvg)
│  - Model'i gunceller
│
└─ ADIM 6: Sonraki Round
   - Yeni overlap set secilir
   - Round N+1 baslar
```

## 8.3 Ornek Calisma (5 Round)

```
Round 1:
  Node A: score=0.59  → +2 token    | Stake: 102
  Node B: score=0.57  → +2 token    | Stake: 102
  Node C: score=0.58  → +2 token    | Stake: 102
  Node D: score=-0.21 → -5 token    | Stake: 95
  Model accuracy: 38%

Round 2:
  Node A: score=0.61  → +2 token    | Stake: 104
  Node B: score=0.59  → +2 token    | Stake: 104
  Node C: score=0.60  → +2 token    | Stake: 104
  Node D: score=-0.18 → -5 token    | Stake: 90
  Model accuracy: 56%

Round 3:
  Node A: score=0.62  → +2 token    | Stake: 106
  Node B: score=0.60  → +2 token    | Stake: 106
  Node C: score=0.61  → +2 token    | Stake: 106
  Node D: score=-0.23 → -5 token    | Stake: 85
  Model accuracy: 71%

Round 4:
  Node A: score=0.63  → +2 token    | Stake: 108
  Node B: score=0.61  → +2 token    | Stake: 108
  Node C: score=0.62  → +2 token    | Stake: 108
  Node D: score=-0.19 → -5 token    | Stake: 80
  Model accuracy: 82%

Round 5:
  Node A: score=0.64  → +2 token    | Stake: 110
  Node B: score=0.62  → +2 token    | Stake: 110
  Node C: score=0.63  → +2 token    | Stake: 110
  Node D: score=-0.20 → -5 token    | Stake: 75
  Model accuracy: 90%

Sonuc:
  - Model egitildi (90% accuracy)
  - 3 durst node para kazandi (100 → 110)
  - Sahtekar para kaybetti (100 → 75)
  - Sahtecinin gradient'leri model'e dahil edilmedi
```

---

# 9. SALDIRI VEKTORLERI VE SAVUNMALAR

## 9.1 Saldiri Analizi

### Saldiri 1: Random Gradient (Tembel Node)

```
Saldiri: Node hesaplama yapmadan random gradient gonderir
Tespit:  Random gradient, durst node'larla korelasyon gostermez
Sonuc:   Cosine similarity ≈ 0 → threshold altinda → SLASH
Zorluk:  Kolay tespit
```

### Saldiri 2: Collusion (Anlasmalı Hile)

```
Saldiri: K node anlasip ayni sahte gradient'i gonderir
Tespit:  Overlap set her round rastgele degisir
         Colluder'lar hangi veriye sinav olacagini onceden bilemez
         Ayni sahte cevabi koordine etmek icin gercek hesaplamayi
         yapmak zorundalar — bu da durst hesaplamayla ayni sey
Sonuc:   N >> K oldugunda (ornegin 1000 node, 5 colluder)
         colluder'lar azinlik kalir → tespit edilir
Zorluk:  N buyudukce pratik olarak imkansiz
```

### Saldiri 3: Sybil (Tek Kisi Cok Node)

```
Saldiri: Tek kisi 100 sahte node acar
Tespit:  Her node icin minimum stake gerekli
         100 node = 100x stake riski
Sonuc:   Ekonomik olarak irrasyonel
Zorluk:  Yuksek stake ile cozu edilir
```

### Saldiri 4: Subtle Poisoning (Ince Zehirleme)

```
Saldiri: Node %95 dogru gradient + %5 bias gonderir
Tespit:  Tek round'da zor. Ama cok round boyunca
         surekli "biraz farkli" olan node istatistiksel
         olarak tespit edilir (reputation sistemi)
Sonuc:   Binlerce node arasinda tek node'un %5 bias'i
         model uzerinde olculebilir etki yaratmaz
Zorluk:  Pratik etkisi ihmal edilebilir
```

### Saldiri 5: Coordinator Manipulasyonu

```
Saldiri: Coordinator skorlari degistirir
Tespit:  Skorlama on-chain'de kayitli
         Herkes gradient'leri gorur, skoru bagimsiz hesaplayabilir
Sonuc:   Fraud proof sunulabilir
Zorluk:  On-chain scoring ile minimize edilir
```

## 9.2 Savunma Ozeti

```
Birincil savunma:     Peer prediction matematigi (mekanizma seviyesi)
Ikincil savunma:      Yuksek stake gereksinimi (ekonomik seviye)
Ucuncul savunma:      Rastgele overlap set (operasyonel seviye)
Dorduncul savunma:    On-chain transparency (dogrulama seviye)

Buyuk node sayisi + yuksek stake = sistemin guvenilirlik garantisi
Peer prediction'in matematiksel garantisi bunun uzerine eklenir.
```

---

# 10. NEDEN MONAD?

## 10.1 Teknik Gereksinimler

PeerTrain her egitim round'unda on-chain islem yapar:
- Skor submission (N node icin N kayit)
- Stake guncelleme (slash/reward)
- Event emission

Bu, **yuksek throughput ve dusuk gecikme** gerektirir.

## 10.2 Monad'in Avantajlari

```
Ozellik                  Monad           Ethereum       Diger L2'ler
─────────────────────    ──────────      ──────────     ───────────
TPS                      10,000          ~15            ~100-1000
Finality                 ~1 saniye       ~12 dakika     ~2-10 dakika
Gas maliyeti             Cok dusuk       Yuksek         Orta
Parallel execution       Evet            Hayir          Kismi
EVM uyumlulugu           %100            N/A            Degisir
```

## 10.3 Neden Parallel Execution Onemli?

```
Her round'da N node icin N skor submission + N stake guncelleme var.

Seri islem:    N * 2 tx * tx_suresi = yavas
Paralel islem: 2 * tx_suresi = hizli (Monad paralel calistirir)

100 node icin:
  Ethereum:  ~200 blok beklemek gerekebilir
  Monad:     1-2 blok icinde tamamlanir
```

---

# 11. TEKNOLOJI STACK'I

```
Katman              Teknoloji              Neden
──────────────      ───────────────        ─────────────────────
Smart Contracts     Solidity ^0.8.19       Monad EVM uyumlu
Contract Deploy     Hardhat / Foundry      Standart tooling
Backend             Python 3.11+           PyTorch ekosistemi
API Framework       FastAPI                Hizli, async, WebSocket
ML Framework        PyTorch                Gradient hesaplama
Veri Seti           MNIST                  Basit, demo icin yeterli
Chain Interaction   web3.py                Python-native Ethereum lib
Frontend            Next.js 14 + React     Modern, hizli
UI Framework        TailwindCSS            Hizli gelistirme
Charting            Recharts               React-native grafikler
Deploy (Backend)    Railway                Ucretsiz tier yeterli
Deploy (Frontend)   Vercel                 Ucretsiz, Next.js optimize
Deploy (Contracts)  Monad Testnet          Ucretsiz testnet tokenlari
```

---

# 12. DEPLOY PLANI

## 12.1 Altyapi

```
┌─────────────────────────────────────────────────┐
│              KULLANICI (Browser)                  │
│           peertrain.vercel.app                    │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────┐
│         BACKEND (Railway - Ucretsiz Tier)        │
│                                                  │
│   coordinator   (FastAPI, port 8000)             │
│   node-a        (Python worker, honest)          │
│   node-b        (Python worker, honest)          │
│   node-c        (Python worker, honest)          │
│   node-d        (Python worker, cheater)         │
│                                                  │
│   Alternatif: Tek process, multi-thread          │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────┐
│              MONAD TESTNET                       │
│                                                  │
│   NodeRegistry    deployed at 0x...              │
│   StakeVault      deployed at 0x...              │
│   ScoringEngine   deployed at 0x...              │
└─────────────────────────────────────────────────┘
```

## 12.2 Maliyet

```
Bilesen               Maliyet       Aciklama
──────────────        ────────      ──────────────────────
Monad Testnet         0$            Testnet ucretsiz
Railway               0$            5$/ay kredi yeterli
Vercel                0$            Free tier
Domain (opsiyonel)    0-10$         Olmasa da olur
PyTorch (CPU)         0$            GPU gereksiz, MNIST kucuk
──────────────────────────────────────────────────────────
TOPLAM                0$
```

---

# 13. HACKATHON DEMO SENARYOSU

## 13.1 Juri Deneyimi

```
Adim 1: Juri peertrain.vercel.app'i acar

Adim 2: Dashboard'da 4 node gorulur:
        ┌─────────────────────────────────────┐
        │  Node A  ████████████  Honest       │
        │  Node B  ████████████  Honest       │
        │  Node C  ████████████  Honest       │
        │  Node D  ████████████  Unknown      │
        │                                     │
        │  [Start Training] butonu            │
        └─────────────────────────────────────┘

Adim 3: "Start Training" tiklanir, egitim baslar

Adim 4: Her round guncellenir:
        ┌─────────────────────────────────────┐
        │  Round 3/10                         │
        │                                     │
        │  Node A  Score: 0.94  +2 MON  ✓    │
        │  Node B  Score: 0.91  +2 MON  ✓    │
        │  Node C  Score: 0.93  +2 MON  ✓    │
        │  Node D  Score: 0.11  -5 MON  ✗    │
        │                                     │
        │  Model Accuracy: 68%  ████████░░░   │
        │                                     │
        │  Stake Durumu:                      │
        │  A: ████████████████ 106 MON        │
        │  B: ████████████████ 106 MON        │
        │  C: ████████████████ 106 MON        │
        │  D: ████████░░░░░░░░  85 MON        │
        └─────────────────────────────────────┘

Adim 5: 10 round sonra sonuc:
        ┌─────────────────────────────────────┐
        │  EGITIM TAMAMLANDI                  │
        │                                     │
        │  Final Model Accuracy: 93%          │
        │                                     │
        │  Node A: 110 MON (+10)  Honest ✓    │
        │  Node B: 110 MON (+10)  Honest ✓    │
        │  Node C: 110 MON (+10)  Honest ✓    │
        │  Node D:  50 MON (-50)  Cheater ✗   │
        │                                     │
        │  Sahteci tespit edildi!              │
        │  Sahte gradient'ler modele           │
        │  dahil edilmedi.                     │
        │                                     │
        │  [Monad Explorer'da Goruntule]      │
        └─────────────────────────────────────┘

Adim 6: Monad Explorer linki tiklanir
        → Gercek on-chain tx'ler gorulur
        → Slash/reward islemleri dogrulanir
```

## 13.2 Demo Pitch (2 Dakika)

```
"AI model egitimi artik 1 milyar dolar maliyetle yapiliyor.
 Bunu merkeziyetsiz hale getirmenin tek engeli guven problemi:
 node'larin durust calistigini nasil bileceksiniz?

 0G diyor ki: ozel donanim alsınlar.
 Bittensor diyor ki: validatorler puanlasın.

 Biz diyoruz ki: matematik yeter.

 PeerTrain, peer prediction mekanizmasini AI training
 verification'a uygulayan ilk protokol.

 Ground truth olmadan, oracle olmadan, ozel donanim olmadan
 sahteciligi tespit ediyor.

 Simdi canli demo'yu gostereyim..."
```

---

# 14. REKABET ANALIZI

## 14.1 Karsilastirma Tablosu

```
                PeerTrain    0G          Bittensor    GradientCoin
                ─────────    ──────      ─────────    ────────────
Dogrulama       Peer         TEE         Ekonomik     Redundant
Yontemi         Prediction   (Donanim)   Tesvik       Computation

Ozel Donanim    Hayir        Evet        Hayir        Hayir
Gerekli?

Oracle/         Hayir        Hayir       Evet         Hayir
Validator                                (validatorler)
Gerekli?

Permissionless  Evet         Hayir       Kismi        Evet

Matematiksel    Evet         Evet        Hayir        Hayir
Garanti?        (dominant    (kriptografik)(oyun teorisi (redundancy)
                strategy)    attestation) varsayimlar)

Maliyet         Dusuk        Yuksek      Orta         Yuksek
                                                      (2x hesaplama)

Bilinen         Yok          Intel SGX   Validatör    Cok fazla
Saldiri                      side-channel collusion    kaynak israf
Zafiyetleri

Uretimde        Hayir        Evet        Evet         Hayir
Kullaniliyor?   (yeni)       (canli)     (canli)      (akademik)
```

## 14.2 PeerTrain'in Benzersiz Konumu

```
                  Permissionless
                       |
           PeerTrain ←─┤
                       |
    Dusuk Maliyet ─────┼───── Matematiksel Garanti
                       |
                       |
                  Donanimsiz
```

Hicbir mevcut proje bu dort ozelligi ayni anda sunmuyor.

---

# 15. YENILIKCILIK (NOVELTY) ANALIZI

## 15.1 Arastirma Sonuclari

Kapsamli bir arastirma sonucunda:

- **"peer prediction" + "AI training" + "gradient verification"** icin proje/paper: **Bulunamadi**
- **"peer prediction" + "blockchain verification"** icin paper: Var (Verifier's Dilemma, arXiv:2406.01794) — ama AI training icin degil
- **"peer prediction" + "machine learning"** icin paper: Var (Peer Prediction for Learning Agents, arXiv:2208.04433) — ama bilgi elicitation icin, training verification icin degil
- **Decentralized AI training verification** projeleri: Var (0G, Bittensor) — ama peer prediction kullanmiyor

## 15.2 Sonuc

PeerTrain, peer prediction mekanizmasini AI training gradient verification'a uygulayan **bilinen ilk implementasyon**. Bu kombinasyon:
- Akademik literaturde yok
- Mevcut projelerde yok
- Potansiyel olarak yayinlanabilir bir arastirma katkisi

---

# 16. GELECEK VIZYONU

## 16.1 Hackathon Sonrasi Yol Haritasi

```
Faz 1: Hackathon (simdi)
  → 4 node (3 honest + 1 cheater), MNIST, temel PP, Monad testnet

Faz 2: Genisleme (1-3 ay)
  → 10+ node, CIFAR-10, gelismis PP (MTS), testnet
  → Commit-reveal eklenmesi
  → Reputation sistemi

Faz 3: Production (3-6 ay)
  → 100+ node, gercek model egitimi
  → Monad mainnet deploy
  → Token ekonomisi tasarimi

Faz 4: Olcekleme (6-12 ay)
  → 1000+ node
  → Frontier model egitimi
  → Cross-chain destegi
  → Akademik paper yayini
```

## 16.2 Uzun Vadeli Vizyon

```
Bugun:    MNIST + 4 node + testnet
          ↓
Yarin:    GPT olceginde model + 10.000 node + mainnet
          ↓
Vizyon:   Herkes AI egitimne katilabilir.
          Donanim engeli yok.
          Guven engeli yok.
          Matematik garantiyi sagliyor.
          AI egitimi demokratiklesiyor.
```

---

# KAYNAKLAR

## Akademik
- Miller, Resnick, Zeckhauser. "Eliciting Informative Feedback: The Peer-Prediction Method." Management Science, 2005.
- Prelec, D. "A Bayesian Truth Serum for Subjective Data." Science, 2004.
- Dasgupta, A. & Ghosh, A. "Crowdsourced Judgement Elicitation with Endogenous Proficiency." WWW, 2013.
- Radanovic, G. & Faltings, B. "A Robust Bayesian Truth Serum for Non-Binary Signals." AAAI, 2013.

## Teknik / Endüstri
- 0G Labs. "Why Verification Matters in Decentralized AI Training." 0g.ai/blog, 2026.
- Bittensor Whitepaper. bittensor.com
- arXiv:2406.01794 — "It Takes Two: A Peer-Prediction Solution for Blockchain Verifier's Dilemma"
- arXiv:2208.04433 — "Peer Prediction for Learning Agents"
- arXiv:2308.10502 — "GradientCoin: A Peer-to-Peer Decentralized Large Language Models"

## Teknoloji
- PyTorch Documentation. pytorch.org
- Monad Documentation. monad.xyz
- Solidity Documentation. docs.soliditylang.org
- Federated Averaging (FedAvg). McMahan et al., 2017.

---

*Bu rapor PeerTrain projesi icin hazirlanmistir. Icerik hackathon submission, yatirimci sunumu ve teknik dokumantasyon amaclidir.*
