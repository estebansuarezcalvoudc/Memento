import {
  useSetTheme,
  useTheme,
  type Theme,
} from '../../../../stores/themeStore'
import Select from '../../../common/Select'

export default function GeneralView() {
  const theme = useTheme()
  const setTheme = useSetTheme()

  return (
    <>
      <Select
        label="Theme"
        value={theme}
        onChange={e => setTheme(e.target.value as Theme)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </Select>
      <Select label="Language">
        <option value="English">English</option>
        <option value="Spanish">Spanish</option>
      </Select>
    </>
  )
}
