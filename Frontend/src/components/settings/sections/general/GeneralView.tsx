import Select from '../../../common/Select'

export default function GeneralView() {
  return (
    <>
      <Select label="Theme">
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
