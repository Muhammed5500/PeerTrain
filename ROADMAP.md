# PeerTrain — Hackathon Roadmap (Claude Opus 4.6 Vibe Coding)
## Adim Adim, Dosya Dosya, Komut Komut

---

# GENEL KURALLAR

```
1. Her adimi sirayla yap. Atlama.
2. Her adimin sonunda test et. Kirik birakma.
3. Claude'a her seferinde net prompt ver.
4. Bir sey calismazsa hemen sonraki adima gecme, fix et.
5. Her buyuk milestone'dan sonra git commit at.
```

---

# FAZ 0: PROJE KURULUMU (30 dakika)

## Adim 0.1: Repo Olustur

Claude'a soyle:
```
"PeerTrain adinda bir proje olustur. Monorepo yapisi olacak:

peertrain/
├── contracts/          # Solidity smart contracts
├── backend/            # Python FastAPI backend
├── frontend/           # Next.js dashboard
├── scripts/            # Deploy ve test scriptleri
├── .gitignore
└── README.md

Her klasoru olustur, .gitignore'a node_modules, __pycache__,
.env, .next ekle. README'ye projenin tek satirlik aciklamasini yaz."
```

## Adim 0.2: Git Baslat

```
cd peertrain
git init
git add .
git commit -m "init: project structure"
```

## Adim 0.3: Environment Dosyalari

Claude'a soyle:
```
"Asagidaki .env.example dosyalarini olustur:

backend/.env.example:
  MONAD_RPC_URL=https://testnet-rpc.monad.xyz
  PRIVATE_KEY_COORDINATOR=
  PRIVATE_KEY_NODE_A=
  PRIVATE_KEY_NODE_B=
  PRIVATE_KEY_NODE_C=
  PRIVATE_KEY_NODE_D=
  SCORING_ENGINE_ADDRESS=
  STAKE_VAULT_ADDRESS=
  NODE_REGISTRY_ADDRESS=

frontend/.env.example:
  NEXT_PUBLIC_API_URL=http://localhost:8000
  NEXT_PUBLIC_MONAD_EXPLORER=https://testnet.monadexplorer.com

Gercek .env dosyalarini .gitignore'a ekle."
```

---

# FAZ 1: SMART CONTRACTS (2-3 saat)

## Adim 1.1: Hardhat Kurulumu

Claude'a soyle:
```
"contracts/ klasorunde Hardhat projesi kur.

npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

hardhat.config.js'de Monad testnet ekle:
  - Network name: monad-testnet
  - RPC URL: .env'den oku
  - Chain ID: 10143

dotenv paketini de kur."
```

## Adim 1.2: NodeRegistry.sol

Claude'a soyle:
```
"NodeRegistry.sol yaz. Ozellikleri:

- Node struct: owner, stakeAmount, isActive, registeredAt
- mapping(address => Node) public nodes
- address[] public activeNodes
- minimumStake degiskeni (constructor'da set et)

Fonksiyonlar:
- register() external payable
  → minimumStake kontrolu
  → zaten kayitli mi kontrolu
  → Node struct olustur, activeNodes'a ekle
  → NodeRegistered event'i emit et

- deactivateNode(address node) external (sadece owner veya scoringEngine)
  → isActive = false yap
  → NodeRemoved event'i emit et

- getActiveNodes() external view returns (address[] memory)
- getNodeCount() external view returns (uint256)
- isNodeActive(address) external view returns (bool)

Event'ler:
- NodeRegistered(address indexed node, uint256 stake)
- NodeRemoved(address indexed node)

Solidity ^0.8.19 kullan."
```

## Adim 1.3: NodeRegistry Test

Claude'a soyle:
```
"NodeRegistry icin Hardhat test yaz (test/NodeRegistry.test.js):

- Basarili register testi
- minimumStake altinda register deneyince revert testi
- Ayni adresle iki kez register deneyince revert testi
- getActiveNodes dogru donuyor testi
- deactivateNode testi
- Event emit testi

npx hardhat test ile calistir, hepsinin gectiginden emin ol."
```

TEST GECTI MI? → Evet → devam. Hayir → fix et.

## Adim 1.4: StakeVault.sol

Claude'a soyle:
```
"StakeVault.sol yaz. Ozellikleri:

- mapping(address => uint256) public stakes
- address public scoringEngine (constructor'da set et)
- address public owner

Fonksiyonlar:
- stake() external payable
  → stakes[msg.sender] += msg.value
  → Staked event emit et

- slash(address node, uint256 amount) external
  → sadece scoringEngine cagirabilir (modifier)
  → stakes[node] >= amount kontrolu
  → stakes[node] -= amount
  → Slashed event emit et

- reward(address node, uint256 amount) external
  → sadece scoringEngine cagirabilir
  → stakes[node] += amount
  → Rewarded event emit et

- withdraw() external
  → kullanici kendi stake'ini cekebilir
  → stakes[msg.sender] sifirla, transfer et

- getStake(address) external view returns (uint256)

Event'ler:
- Staked(address indexed node, uint256 amount)
- Slashed(address indexed node, uint256 amount)
- Rewarded(address indexed node, uint256 amount)

Modifier:
- onlyScoringEngine"
```

## Adim 1.5: StakeVault Test

Claude'a soyle:
```
"StakeVault icin test yaz:

- stake() dogru calisyor testi
- slash() sadece scoringEngine'den calisyor testi
- slash() yetersiz stake'de revert testi
- reward() dogru calisyor testi
- withdraw() testi
- Yetkisiz slash denemesinde revert testi

Calistir ve hepsinin gectigini dogrula."
```

## Adim 1.6: ScoringEngine.sol

Claude'a soyle:
```
"ScoringEngine.sol yaz. Ozellikleri:

- StakeVault ve NodeRegistry referanslari (constructor'da)
- uint256 public currentRound
- int256 public threshold = 200 (0.200 * 1000 fixed point)
- uint256 public slashRate = 5 (yuzde)
- uint256 public rewardRate = 2 (yuzde)
- mapping(uint256 => mapping(address => int256)) public roundScores
- address public coordinator

Fonksiyonlar:
- submitRoundScores(address[] calldata nodes, int256[] calldata scores) external
  → sadece coordinator cagirabilir
  → nodes.length == scores.length kontrolu
  → currentRound++
  → her node icin:
    - roundScores'a kaydet
    - score < threshold ise → vault.slash(node, stake * slashRate / 100)
    - score >= threshold ise → vault.reward(node, stake * rewardRate / 100)
  → RoundSettled event emit et

- getRoundScore(uint256 round, address node) external view returns (int256)
- getCurrentRound() external view returns (uint256)

Event'ler:
- RoundSettled(uint256 indexed roundId, uint256 nodeCount)
- NodeSlashed(uint256 indexed roundId, address indexed node, int256 score)
- NodeRewarded(uint256 indexed roundId, address indexed node, int256 score)"
```

## Adim 1.7: ScoringEngine Test

Claude'a soyle:
```
"ScoringEngine icin test yaz:

- Basarili submitRoundScores testi (2 honest + 1 cheater skorlari)
- Threshold altindaki node slash yiyor testi
- Threshold ustundeki node reward aliyor testi
- Round sayaci dogru artiyor testi
- Yetkisiz submitRoundScores revert testi
- Event emit testleri

Tum testleri calistir."
```

## Adim 1.8: Deploy Script

Claude'a soyle:
```
"scripts/deploy.js yaz:

1. NodeRegistry deploy et (minimumStake: 0.01 MON)
2. StakeVault deploy et (scoringEngine adresi sonra set edilecek)
3. ScoringEngine deploy et (vault ve registry adreslerini ver)
4. StakeVault'un scoringEngine adresini set et
5. Tum adresleri console'a yazdir
6. Adresleri deployed-addresses.json dosyasina kaydet

npx hardhat run scripts/deploy.js --network monad-testnet
ile calistir."
```

## Adim 1.9: Monad Testnet'e Deploy

```
Oncelikle:
1. Monad faucet'ten testnet token al (4 wallet icin)
2. .env dosyasina private key'leri yaz
3. Deploy scriptini calistir
4. Adresleri kaydet
```

Claude'a soyle:
```
"Deploy scriptini calistir ve cikan adresleri bana goster.
Sonra her adresi Monad explorer'da kontrol et."
```

GIT COMMIT:
```
git add contracts/
git commit -m "feat: smart contracts with tests, deployed to Monad testnet"
```

---

# FAZ 2: BACKEND — CORE LOGIC (3-4 saat)

## Adim 2.1: Python Ortami

Claude'a soyle:
```
"backend/ klasorunde Python projesi kur:

python -m venv venv

requirements.txt olustur:
  fastapi==0.109.0
  uvicorn==0.27.0
  web3==6.14.0
  torch==2.2.0+cpu (CPU-only versiyon)
  torchvision==0.17.0+cpu
  numpy==1.26.3
  python-dotenv==1.0.0
  pydantic==2.5.3

NOT: PyTorch CPU versiyonunu kur, GPU gereksiz:
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

requirements.txt'deki diger paketleri kur:
pip install -r requirements.txt"
```

## Adim 2.2: Model Tanimla

Claude'a soyle:
```
"backend/model.py olustur. Basit bir MNIST CNN modeli:

class MNISTModel(nn.Module):
  - Conv2d(1, 16, 3, padding=1)
  - ReLU
  - MaxPool2d(2)
  - Conv2d(16, 32, 3, padding=1)
  - ReLU
  - MaxPool2d(2)
  - Flatten
  - Linear(32 * 7 * 7, 128)
  - ReLU
  - Linear(128, 10)

forward() metodu yaz.
Parametre sayisini yazdir: yaklasik 60K olmali.

Test olarak:
  model = MNISTModel()
  x = torch.randn(1, 1, 28, 28)
  output = model(x)
  assert output.shape == (1, 10)
  print('Model OK, params:', sum(p.numel() for p in model.parameters()))

Bu dosyayi calistirip test et."
```

## Adim 2.3: Data Manager

Claude'a soyle:
```
"backend/data_manager.py olustur.

class DataManager:
  def __init__(self):
    → MNIST dataseti indir (torchvision.datasets.MNIST)
    → train_data ve test_data olarak ayir

  def get_round_data(self, round_id: int, num_nodes: int, overlap_ratio: float = 0.1):
    → round_id'yi seed olarak kullan (deterministik randomness)
    → overlap_size = int(len(train_data) * overlap_ratio)
    → overlap_indices: rastgele secilen overlap_size kadar index
    → Kalan indeksleri num_nodes'a esit bol
    → Her node icin return:
      {
        'node_0': {'private_indices': [...], 'shared_indices': [...]},
        'node_1': {'private_indices': [...], 'shared_indices': [...]},
        ...
      }
    → shared_indices tum node'larda AYNI

  def get_batch(self, indices):
    → Verilen indekslerdeki resimleri ve label'lari dondur
    → return images_tensor, labels_tensor

Test et:
  dm = DataManager()
  data = dm.get_round_data(round_id=1, num_nodes=4)

  # Overlap set'ler ayni mi kontrol et
  assert data['node_0']['shared_indices'] == data['node_1']['shared_indices']

  # Private set'ler farkli mi kontrol et
  assert data['node_0']['private_indices'] != data['node_1']['private_indices']

  print('DataManager OK')"
```

## Adim 2.4: Node Simulator

Claude'a soyle:
```
"backend/node.py olustur.

class Node:
  def __init__(self, node_id: str, is_honest: bool = True):
    self.node_id = node_id
    self.is_honest = is_honest

  def compute_gradient(self, model, images, labels):
    if self.is_honest:
      → model.zero_grad()
      → output = model(images)
      → loss = F.cross_entropy(output, labels)
      → loss.backward()
      → gradient = {name: param.grad.clone() for name, param in model.named_parameters()}
      → return gradient
    else:
      → Ayni shape'te random gradient dondur
      → gradient = {name: torch.randn_like(param) for name, param in model.named_parameters()}
      → return gradient

Test et:
  from model import MNISTModel
  model = MNISTModel()

  honest_node = Node('A', is_honest=True)
  cheater_node = Node('C', is_honest=False)

  # Dummy data
  images = torch.randn(32, 1, 28, 28)
  labels = torch.randint(0, 10, (32,))

  g_honest = honest_node.compute_gradient(model, images, labels)
  g_cheater = cheater_node.compute_gradient(model, images, labels)

  print('Honest gradient sample:', list(g_honest.values())[0].flatten()[:5])
  print('Cheater gradient sample:', list(g_cheater.values())[0].flatten()[:5])
  print('Node OK')"
```

## Adim 2.5: Peer Prediction Engine

Claude'a soyle:
```
"backend/peer_prediction.py olustur.

import torch
import torch.nn.functional as F

class PeerPredictionEngine:
  def __init__(self, threshold: float = 0.2):
    self.threshold = threshold

  def flatten_gradient(self, gradient: dict) -> torch.Tensor:
    → Tum gradient tensor'lerini tek bir 1D tensor'e birlestir
    → return torch.cat([g.flatten() for g in gradient.values()])

  def cosine_similarity(self, g1: dict, g2: dict) -> float:
    → flat1 = self.flatten_gradient(g1)
    → flat2 = self.flatten_gradient(g2)
    → return F.cosine_similarity(flat1.unsqueeze(0), flat2.unsqueeze(0)).item()

  def compute_scores(self, shared_gradients: dict) -> dict:
    → Input: {'node_A': gradient_dict, 'node_B': gradient_dict, ...}
    → Her node cifti icin cosine similarity hesapla
    → Her node'un skoru = diger node'larla ortalama similarity
    → return {
        'scores': {'node_A': 0.60, 'node_B': 0.58, 'node_C': 0.59, 'node_D': -0.21},
        'similarity_matrix': {
          ('node_A', 'node_B'): 0.97,
          ('node_A', 'node_C'): 0.99,
          ('node_A', 'node_D'): 0.08,
          ('node_B', 'node_C'): 0.98,
          ('node_B', 'node_D'): 0.05,
          ('node_C', 'node_D'): 0.06
        },
        'decisions': {'node_A': 'reward', 'node_B': 'reward', 'node_C': 'reward', 'node_D': 'slash'}
      }

  def is_honest(self, score: float) -> bool:
    → return score >= self.threshold

Test et:
  pp = PeerPredictionEngine()

  # Simule gradient'ler
  honest_g1 = {'w': torch.tensor([0.23, -0.41, 0.87, 0.12, -0.55])}
  honest_g2 = {'w': torch.tensor([0.25, -0.39, 0.85, 0.14, -0.53])}
  honest_g3 = {'w': torch.tensor([0.22, -0.43, 0.88, 0.11, -0.56])}
  cheater_g = {'w': torch.tensor([0.91, 0.12, -0.55, 0.44, 0.33])}

  result = pp.compute_scores({
    'node_A': honest_g1,
    'node_B': honest_g2,
    'node_C': honest_g3,
    'node_D': cheater_g
  })

  print('Scores:', result['scores'])
  print('Decisions:', result['decisions'])

  assert result['decisions']['node_A'] == 'reward'
  assert result['decisions']['node_C'] == 'reward'
  assert result['decisions']['node_D'] == 'slash'
  print('PeerPrediction OK')"
```

## Adim 2.6: Chain Service

Claude'a soyle:
```
"backend/chain_service.py olustur.

from web3 import Web3
import json, os

class ChainService:
  def __init__(self):
    → .env'den MONAD_RPC_URL oku
    → Web3 instance olustur
    → Contract ABI'lari yukle (contracts/artifacts'ten)
    → Contract instance'lari olustur
    → Coordinator wallet'i yukle

  def register_node(self, private_key: str) -> str:
    → NodeRegistry.register() cagir, minimumStake kadar MON gonder
    → tx hash dondur

  def stake_node(self, private_key: str, amount: int) -> str:
    → StakeVault.stake() cagir
    → tx hash dondur

  def submit_scores(self, addresses: list, scores: list) -> str:
    → ScoringEngine.submitRoundScores() cagir
    → scores'lari int'e cevir (0.94 → 940, fixed point * 1000)
    → tx hash dondur

  def get_stake(self, address: str) -> int:
    → StakeVault.getStake() cagir
    → return stake amount

  def get_round(self) -> int:
    → ScoringEngine.getCurrentRound() cagir

NOT: Her tx icin gas estimation yap.
NOT: Nonce yonetimi dikkatli ol (ayni anda birden fazla tx gondermeyebilirsin).
NOT: TX receipt'i bekle (w3.eth.wait_for_transaction_receipt).

Basit test:
  cs = ChainService()
  print('Connected:', cs.w3.is_connected())
  print('Current round:', cs.get_round())
  print('ChainService OK')"
```

## Adim 2.7: Training Coordinator (ANA MANTIK)

Claude'a soyle:
```
"backend/coordinator.py olustur. Bu tum sistemi birlestiren ana sinif.

from model import MNISTModel
from data_manager import DataManager
from node import Node
from peer_prediction import PeerPredictionEngine
from chain_service import ChainService

class TrainingCoordinator:
  def __init__(self):
    self.model = MNISTModel()
    self.data_manager = DataManager()
    self.pp_engine = PeerPredictionEngine(threshold=0.2)
    self.chain = ChainService()

    self.nodes = {
      'node_A': Node('node_A', is_honest=True),
      'node_B': Node('node_B', is_honest=True),
      'node_C': Node('node_C', is_honest=True),
      'node_D': Node('node_D', is_honest=False),
    }

    # Node wallet adresleri (.env'den)
    self.node_addresses = {
      'node_A': os.getenv('ADDRESS_NODE_A'),
      'node_B': os.getenv('ADDRESS_NODE_B'),
      'node_C': os.getenv('ADDRESS_NODE_C'),
      'node_D': os.getenv('ADDRESS_NODE_D'),
    }

    self.round_history = []
    self.current_round = 0
    self.total_rounds = 10

  def run_round(self) -> dict:
    self.current_round += 1

    # 1. Veri dagit
    round_data = self.data_manager.get_round_data(
      round_id=self.current_round,
      num_nodes=len(self.nodes)
    )

    # 2. Her node'dan shared gradient al
    shared_gradients = {}
    private_gradients = {}

    for i, (node_id, node) in enumerate(self.nodes.items()):
      node_key = f'node_{i}'

      # Shared (sinav) verisi
      shared_images, shared_labels = self.data_manager.get_batch(
        round_data[node_key]['shared_indices']
      )
      shared_gradients[node_id] = node.compute_gradient(
        self.model, shared_images, shared_labels
      )

      # Private verisi
      private_images, private_labels = self.data_manager.get_batch(
        round_data[node_key]['private_indices']
      )
      private_gradients[node_id] = node.compute_gradient(
        self.model, private_images, private_labels
      )

    # 3. Peer prediction skorla
    pp_result = self.pp_engine.compute_scores(shared_gradients)

    # 4. On-chain settlement
    addresses = [self.node_addresses[nid] for nid in self.nodes.keys()]
    scores_fixed = [int(pp_result['scores'][nid] * 1000) for nid in self.nodes.keys()]
    tx_hash = self.chain.submit_scores(addresses, scores_fixed)

    # 5. Model guncelle (sadece honest node'larin gradient'leriyle)
    honest_gradients = []
    for node_id in self.nodes.keys():
      if pp_result['decisions'][node_id] == 'reward':
        honest_gradients.append(private_gradients[node_id])

    if honest_gradients:
      self._aggregate_and_update(honest_gradients)

    # 6. Model accuracy hesapla
    accuracy = self._evaluate()

    # 7. Stake bilgilerini al
    stakes = {}
    for node_id in self.nodes.keys():
      addr = self.node_addresses[node_id]
      stakes[node_id] = self.chain.get_stake(addr)

    # 8. Round sonucunu kaydet
    round_result = {
      'round': self.current_round,
      'scores': pp_result['scores'],
      'similarity_matrix': pp_result['similarity_matrix'],
      'decisions': pp_result['decisions'],
      'accuracy': accuracy,
      'stakes': stakes,
      'tx_hash': tx_hash,
    }

    self.round_history.append(round_result)
    return round_result

  def _aggregate_and_update(self, gradients: list):
    → FedAvg: tum gradient'lerin ortalamasini al
    → Model parametrelerini guncelle:
      with torch.no_grad():
        for name, param in self.model.named_parameters():
          avg_grad = torch.mean(torch.stack([g[name] for g in gradients]), dim=0)
          param -= 0.01 * avg_grad  # learning rate = 0.01

  def _evaluate(self) -> float:
    → test_data uzerinde model accuracy hesapla
    → self.model.eval()
    → correct / total * 100 dondur

  def get_status(self) -> dict:
    return {
      'current_round': self.current_round,
      'total_rounds': self.total_rounds,
      'is_training': self.current_round < self.total_rounds,
      'round_history': self.round_history,
    }

Henuz API yok, sadece class'i test et:
  coord = TrainingCoordinator()
  result = coord.run_round()
  print('Round 1 result:', result)
  print('Coordinator OK')"
```

## Adim 2.8: FastAPI Server

Claude'a soyle:
```
"backend/main.py olustur. FastAPI server.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from coordinator import TrainingCoordinator
import asyncio

app = FastAPI(title='PeerTrain API')

# CORS — frontend'in baglanabilmesi icin
app.add_middleware(
  CORSMiddleware,
  allow_origins=['*'],
  allow_methods=['*'],
  allow_headers=['*'],
)

coordinator = None
training_task = None

@app.get('/')
def root():
  return {'status': 'PeerTrain API is running'}

@app.post('/start-training')
async def start_training():
  global coordinator, training_task
  coordinator = TrainingCoordinator()

  async def run_training():
    for i in range(coordinator.total_rounds):
      coordinator.run_round()
      await asyncio.sleep(1)  # frontend'in yakalayabilmesi icin kucuk bekleme

  training_task = asyncio.create_task(run_training())
  return {'message': 'Training started', 'total_rounds': coordinator.total_rounds}

@app.get('/status')
def get_status():
  if coordinator is None:
    return {'current_round': 0, 'total_rounds': 0, 'is_training': False, 'round_history': []}
  return coordinator.get_status()

@app.get('/round/{round_id}')
def get_round(round_id: int):
  if coordinator is None or round_id > len(coordinator.round_history):
    return {'error': 'Round not found'}
  return coordinator.round_history[round_id - 1]

Calistir ve test et:
  uvicorn main:app --reload --port 8000

Browser'da:
  http://localhost:8000          → status
  http://localhost:8000/docs     → Swagger UI (otomatik)
"
```

## Adim 2.9: Backend Entegrasyon Testi

Claude'a soyle:
```
"Backend'i calistir (uvicorn main:app --port 8000).
Sonra su istekleri at:

1. GET /              → API calisiyor mu?
2. POST /start-training  → Egitim basliyor mu?
3. GET /status        → Round ilerliyor mu? (birkaç kez dene)
4. GET /round/1       → Ilk round detayi geliyor mu?
   → scores, similarity_matrix, decisions, accuracy, tx_hash

Her response'u kontrol et. Eksik veya hatali bir sey varsa fix et."
```

GIT COMMIT:
```
git add backend/
git commit -m "feat: backend with coordinator, nodes, PP scoring, chain integration"
```

---

# FAZ 3: FRONTEND DASHBOARD (3-4 saat)

## Adim 3.1: Next.js Kurulumu

Claude'a soyle:
```
"frontend/ klasorunde Next.js projesi olustur:

npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --no-import-alias

Ek paketler:
npm install recharts lucide-react

Gereksiz default sayfalari temizle.
app/layout.tsx'de:
  - Title: 'PeerTrain'
  - Dark theme (body background: #0a0a0a, text: white)
  - Font: Inter veya JetBrains Mono"
```

## Adim 3.2: API Client

Claude'a soyle:
```
"frontend/app/lib/api.ts olustur.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function startTraining() {
  const res = await fetch(API_URL + '/start-training', { method: 'POST' })
  return res.json()
}

export async function getStatus() {
  const res = await fetch(API_URL + '/status')
  return res.json()
}

export async function getRound(roundId: number) {
  const res = await fetch(API_URL + '/round/' + roundId)
  return res.json()
}

Type'lar:
interface RoundResult {
  round: number
  scores: Record<string, number>
  similarity_matrix: Record<string, number>
  decisions: Record<string, 'reward' | 'slash'>
  accuracy: number
  stakes: Record<string, number>
  tx_hash: string
}

interface TrainingStatus {
  current_round: number
  total_rounds: number
  is_training: boolean
  round_history: RoundResult[]
}"
```

## Adim 3.3: Ana Sayfa Layout

Claude'a soyle:
```
"app/page.tsx ana sayfayi olustur. Layout:

Ust kisim:
  - Sol: 'PeerTrain' logosu + 'Decentralized AI Training Verification' alt basligi
  - Sag: Round counter ('Round 3/10') + durum badge ('Live' veya 'Idle')

Orta kisim (grid, 4 kolon veya 2x2):
  - 4 tane NodeCard componenti (her node icin bir tane)

Alt kisim (grid, 2 kolon):
  - Sol: Model Accuracy grafigi (Recharts LineChart)
  - Sag: Stake History grafigi (Recharts LineChart)

En alt:
  - Transaction log (son tx'lerin listesi)
  - 'Start Training' butonu (egitim baslamadiysa)

State yonetimi:
  - useEffect ile her 2 saniyede /status endpoint'ini poll et
  - Gelen data ile tum componentleri guncelle

Renk paleti:
  - Background: #0a0a0a
  - Card background: #141414
  - Border: #222222
  - Accent (honest): #22c55e (yesil)
  - Accent (cheater): #ef4444 (kirmizi)
  - Text: #ffffff
  - Muted text: #888888"
```

## Adim 3.4: NodeCard Componenti

Claude'a soyle:
```
"app/components/NodeCard.tsx olustur.

Props:
  - nodeId: string ('Node A', 'Node B', 'Node C', 'Node D')
  - address: string (kisaltilmis: '0x1a2b...3c4d')
  - score: number
  - stake: number
  - initialStake: number
  - decision: 'reward' | 'slash' | null
  - isActive: boolean

Gosterecekleri:
  - Node ismi ve adresi
  - Score bar (0'dan 1'e, renkli progress bar)
    → Yesil: score > 0.5
    → Kirmizi: score < 0.2
    → Sari: arasi
  - Stake miktari ve degisim (+8 veya -5 seklinde)
  - Decision badge: 'Honest ✓' (yesil) veya 'Cheater ✗' (kirmizi)
  - Score numerik degeri

Animasyon:
  - Score bar transition ile degissin
  - Stake degisiminde kisa bir flash efekti"
```

## Adim 3.5: Accuracy Grafigi

Claude'a soyle:
```
"app/components/AccuracyChart.tsx olustur.

Recharts LineChart kullan.

Props:
  - data: {round: number, accuracy: number}[]

Ozellikler:
  - X ekseni: Round numarasi
  - Y ekseni: 0% — 100%
  - Cizgi rengi: #3b82f6 (mavi)
  - Grid ve tooltip
  - Animated
  - Dark theme uyumlu (background transparent, text beyaz)"
```

## Adim 3.6: Stake Grafigi

Claude'a soyle:
```
"app/components/StakeChart.tsx olustur.

Recharts LineChart, 4 cizgi (her node icin bir tane).

Props:
  - data: {round: number, node_A: number, node_B: number, node_C: number, node_D: number}[]

Ozellikler:
  - Node A, B ve C: yesil tonlari (#22c55e, #16a34a, #15803d)
  - Node D: kirmizi (#ef4444)
  - Legend goster
  - Dark theme uyumlu"
```

## Adim 3.7: Round Detail Modal

Claude'a soyle:
```
"app/components/RoundDetail.tsx olustur. Tiklaninca acilan modal.

Props:
  - round: RoundResult
  - onClose: () => void

Gosterecekleri:
  - Round numarasi
  - Cosine Similarity Matrix (tablo seklinde)
    → Yuksek similarity: yesil arka plan
    → Dusuk similarity: kirmizi arka plan
  - Peer Prediction Skor hesaplama formulleri
    → Her node icin: score = avg(sim_with_others) goster
  - Settlement sonuclari: kim ne kadar kazandi/kaybetti
  - TX hash (tiklanabilir link, Monad explorer'a gider)

Overlay modal olsun, disi tiklaninca kapansin."
```

## Adim 3.8: Transaction Log

Claude'a soyle:
```
"app/components/TransactionLog.tsx olustur.

Props:
  - transactions: {round: number, tx_hash: string, type: string}[]

Gosterecekleri:
  - Her satir: Round numarasi | TX hash (kisaltilmis) | Tur (slash/reward)
  - TX hash tiklaninca yeni sekmede Monad explorer'a gider
  - En son tx uste gelsin
  - Maksimum 10 satir goster, scrollable"
```

## Adim 3.9: Live Test (Draw Digit)

Claude'a soyle:
```
"app/components/DrawDigit.tsx olustur.

Egitim tamamlandiktan sonra gorunen canvas:

- 280x280 piksel canvas (28x28'e scale edilecek)
- Mouse ile cizim yapilabilir (siyah zemin, beyaz kalem)
- 'Predict' butonu: canvas'i 28x28'e kucult, backend'e gonder
- 'Clear' butonu: canvas'i temizle
- Sonuc: 'Prediction: 7 (94.3% confidence)' goster

Backend'de yeni endpoint lazim:
POST /predict
  → 28x28 image array al
  → model'den gecir
  → return {digit: 7, confidence: 0.943}

Bu endpoint'i de backend/main.py'ye ekle."
```

## Adim 3.10: Her Seyi Birlestir

Claude'a soyle:
```
"app/page.tsx'de tum componentleri birlestir.

Akis:
1. Sayfa acildiginda /status cagir
2. is_training false ise → 'Start Training' butonu goster
3. Buton tiklaninca → POST /start-training
4. Her 2 saniyede /status poll et
5. round_history degistikce:
   → NodeCard'lari guncelle
   → Accuracy grafiğine yeni nokta ekle
   → Stake grafigine yeni nokta ekle
   → Transaction log'a yeni tx ekle
6. Herhangi bir round'a tiklaninca → RoundDetail modal ac
7. is_training false ve round_history dolu ise → DrawDigit goster

Hepsinin dogru calistigini kontrol et:
  - Backend calistir: cd backend && uvicorn main:app --port 8000
  - Frontend calistir: cd frontend && npm run dev
  - Tarayicida ac: http://localhost:3000
  - Start Training tikla
  - Izle"
```

GIT COMMIT:
```
git add frontend/
git commit -m "feat: frontend dashboard with live training visualization"
```

---

# FAZ 4: ENTEGRASYON VE DUZELTMELER (2-3 saat)

## Adim 4.1: Uctan Uca Test

Claude'a soyle:
```
"Tum sistemi calistir:

1. Smart contract'lar Monad testnet'te deploy edilmis (adresleri kontrol et)
2. Backend'i calistir
3. Frontend'i calistir
4. Start Training tikla
5. 10 round boyunca izle

Kontrol listesi:
□ Node'lar dogru skor aliyor mu?
□ Cheater node slash yiyor mu?
□ Model accuracy artiyor mu?
□ Stake grafigi dogru mu?
□ TX hash'ler gercek mi? (Monad explorer'da kontrol et)
□ Round detail modal dogru mu?
□ Cosine similarity matrix mantikli mi?
□ Draw digit calisiyor mu?

Herhangi bir sorun varsa fix et."
```

## Adim 4.2: Hata Yonetimi

Claude'a soyle:
```
"Asagidaki edge case'leri handle et:

Backend:
  - Monad RPC baglanti hatasi → retry 3 kez, sonra hata don
  - TX fail olursa → log'a yaz, round'u skip etme
  - MNIST indirme hatasi → cache kontrol et

Frontend:
  - API unreachable → 'Backend is offline' mesaji goster
  - Training henuz baslamadiysa → bos state goster
  - Slow network → loading spinner ekle"
```

## Adim 4.3: UI Polishing

Claude'a soyle:
```
"Dashboard'u guzelIestir:

1. Start Training butonuna loading state ekle (spinner)
2. Round gecislerinde kucuk animasyonlar
3. Score bar'larda smooth transition (CSS transition)
4. Cheater tespit edildiginde kirmizi flash efekti
5. Training complete oldugunda confetti veya basarili mesaji
6. Mobile responsive yap (sm: breakpoint'leri)
7. Monad explorer linklerini dogru formatta yap
8. Sayfanin ust kismina kucuk bir 'How it works' aciklamasi ekle"
```

## Adim 4.4: Performance

Claude'a soyle:
```
"Backend performansini kontrol et:

- Her round kac saniye suruyor? (log ekle)
- MNIST batch loading yavas mi? (cache'le)
- Monad TX ne kadar suruyor? (log ekle)
- Frontend polling performansi OK mi?

Eger round suresi > 10 saniye ise:
  - Batch size kucult
  - Overlap set kucult
  - Model kucult"
```

GIT COMMIT:
```
git add .
git commit -m "fix: error handling, UI polish, performance optimization"
```

---

# FAZ 5: DEPLOY (1-2 saat)

## Adim 5.1: Backend Deploy (Railway)

Claude'a soyle:
```
"Backend'i Railway'e deploy etmek icin hazirla:

1. backend/Procfile olustur:
   web: uvicorn main:app --host 0.0.0.0 --port $PORT

2. backend/runtime.txt olustur:
   python-3.11.7

3. backend/requirements.txt'in guncel oldugunu kontrol et

4. PyTorch CPU versiyonunun kurulacagindan emin ol
   requirements.txt'e ekle:
   --extra-index-url https://download.pytorch.org/whl/cpu
   torch==2.2.0+cpu
   torchvision==0.17.0+cpu

Railway'de:
  - GitHub repo'yu bagla
  - Root directory: backend
  - Environment variables ekle (.env'deki her sey)
  - Deploy et
  - URL'yi al (ornek: peertrain-api.up.railway.app)"
```

## Adim 5.2: Frontend Deploy (Vercel)

Claude'a soyle:
```
"Frontend'i Vercel'e deploy etmek icin hazirla:

1. frontend/.env.production olustur:
   NEXT_PUBLIC_API_URL=https://peertrain-api.up.railway.app
   NEXT_PUBLIC_MONAD_EXPLORER=https://testnet.monadexplorer.com

2. Vercel'de:
   - GitHub repo'yu bagla
   - Root directory: frontend
   - Framework: Next.js (otomatik algilayacak)
   - Environment variables ekle
   - Deploy et
   - URL'yi al (ornek: peertrain.vercel.app)"
```

## Adim 5.3: Deploy Sonrasi Test

Claude'a soyle:
```
"Production'da test et:

1. peertrain.vercel.app'i ac
2. Start Training tikla
3. 10 round tamamlansin
4. Kontrol listesi:
   □ API baglantisi calisiyor mu?
   □ Egitim basliyor mu?
   □ Skorlar geliyor mu?
   □ Monad TX'ler basarili mi?
   □ Draw digit calisiyor mu?
   □ Mobile'da gorunum OK mi?

Sorun varsa fix et ve tekrar deploy et."
```

GIT COMMIT:
```
git add .
git commit -m "deploy: Railway backend + Vercel frontend"
```

---

# FAZ 6: FINAL DOKUNUSLAR (1-2 saat)

## Adim 6.1: README

Claude'a soyle:
```
"README.md'yi guncelle. Icermesi gerekenler:

- Proje adi ve tek satirlik aciklama
- Problem tanimi (3-4 cumle)
- Cozum (3-4 cumle)
- Mimari diyagrami (ASCII)
- Teknoloji stack'i
- Canli demo linki
- Nasil calistirilir (local development)
- Ekran goruntusu (screenshot ekle)
- Lisans"
```

## Adim 6.2: Demo Video / GIF

```
Ekran kaydi al:
1. Dashboard'u ac
2. Start Training tikla
3. 10 round boyunca izle (hizlandirilabilir)
4. Cheater'in tespit edildigini goster
5. Draw digit ile test et
6. GIF'e cevir, README'ye ekle
```

## Adim 6.3: Presentation Notlari

Claude'a soyle:
```
"2 dakikalik hackathon pitch'i icin notlar hazirla:

Slide 1: Problem (15 saniye)
  → Merkeziyetsiz AI egitimi buyuyor ama guven sorunu var

Slide 2: Mevcut cozumler ve eksiklikleri (20 saniye)
  → TEE = ozel donanim, Bittensor = subjektif validatorler

Slide 3: PeerTrain cozumu (30 saniye)
  → Peer prediction, overlap set, cosine similarity
  → Donanimsiz, oracle'siz, pure math

Slide 4: Canli demo (45 saniye)
  → Dashboard'u ac, egitimi baslat, sahtecinin yakalanmasini goster

Slide 5: Neden Monad (10 saniye)
  → Parallel execution, yuksek TPS, dusuk gas

Slide 6: Yol haritasi (10 saniye)
  → MNIST → CIFAR → Frontier models"
```

---

# ZAMAN CIZELGESI

```
Gun 1 (6-8 saat):
  ☐ Faz 0: Proje kurulumu (30dk)
  ☐ Faz 1: Smart contracts + deploy (3 saat)
  ☐ Faz 2: Backend core logic (3-4 saat)

Gun 2 (6-8 saat):
  ☐ Faz 2 devami: Backend tamamla + test (1 saat)
  ☐ Faz 3: Frontend dashboard (3-4 saat)
  ☐ Faz 4: Entegrasyon ve duzeltmeler (2-3 saat)

Gun 3 (3-4 saat):
  ☐ Faz 5: Deploy (1-2 saat)
  ☐ Faz 6: Final dokunuslar (1-2 saat)
  ☐ Test, test, test

TOPLAM: ~17-20 saat (3 gun)
```

---

# CLAUDE PROMPT KURALLARI

```
Her prompt'ta:
1. Hangi dosyayi olusturacagini/degistirecegini belirt
2. Dosyanin tam icerigi ne olmali belirt
3. Test nasil yapilacagini belirt
4. Basari kriteri ne belirt

Ornek KOTU prompt:
  "Backend yaz"

Ornek IYI prompt:
  "backend/peer_prediction.py olustur. PeerPredictionEngine sinifi,
   cosine_similarity ve compute_scores metodlari olacak.
   Input olarak gradient dict'leri alacak, output olarak her node'un
   skoru ve similarity matrix donecek. Sonra test olarak 4 gradient
   ver (3 honest, 1 fake) ve assert ile dogru sonuc verdigini kontrol et."

Claude hata yaparsa:
  "Bu hatayi aliyor: [hata mesaji]. Fix et."
  → Claude genelde hatayi gorur ve duzeltir

Claude yanlis yonde giderse:
  "Dur. [X] istemiyorum, [Y] istiyorum. Tekrar yap."
```

---

# KONTROL LISTESI (HACKATHON GUNU)

```
Deploy oncesi:
  □ Tum testler geciyor
  □ Backend local'de calisiyor
  □ Frontend local'de calisiyor
  □ Monad TX'ler basarili
  □ 10 round hatasiz tamamlaniyor

Deploy sonrasi:
  □ Production URL'ler calisiyor
  □ CORS hatasi yok
  □ TX'ler production'da da basarili
  □ Mobile'da gorunum OK
  □ Draw digit calisiyor

Sunum oncesi:
  □ Demo bir kez bastan sona calistirildi
  □ Internet baglantisi stabil
  □ Yedek plan: local demo videosu hazir
  □ Pitch 2 dakika icinde tamamlaniyor
```

---

*Bu roadmap PeerTrain hackathon projesi icin hazirlanmistir.
Her adim Claude Opus 4.6 ile vibe coding yapilarak tamamlanacaktir.*
