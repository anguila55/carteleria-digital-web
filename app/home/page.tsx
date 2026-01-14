// views
import HomeView from '@/Features/Home/View/HomeView'

// actions
import { getDataContent } from '@/Features/Home/Actions'

const page = async () => {
  const dataContent = await getDataContent()
  return <HomeView content={dataContent} />
}

export default page
