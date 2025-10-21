import { Card, CardContent } from "./ui/card"

export function Footer() {
  return (
    <footer>
      <Card>
        <CardContent className="px-5 py-6 text-center">
          <p className="text-sm text-gray-400">
            &copy; 2025 Copyright <span className="font-bold">ALN</span> Barber
          </p>
        </CardContent>
      </Card>
    </footer>
  )
}
