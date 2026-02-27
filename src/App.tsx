import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { AuctionDetail } from './pages/AuctionDetail'
import { CreateAuction } from './pages/CreateAuction'
import { Profile } from './pages/Profile'
import { ManageLayout } from './components/layout/ManageLayout'
import { ManageMint } from './pages/manage/ManageMint'
import { ManageBurn } from './pages/manage/ManageBurn'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="auctions/:id" element={<AuctionDetail />} />
          <Route path="auctions/create" element={<CreateAuction />} />
          <Route path="profile" element={<Profile />} />
          <Route path="manage" element={<ManageLayout />}>
            <Route index element={<Navigate to="/manage/mint" replace />} />
            <Route path="mint" element={<ManageMint />} />
            <Route path="burn" element={<ManageBurn />} />
          </Route>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
