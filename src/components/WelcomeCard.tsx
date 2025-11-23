export function WelcomeCard({ children }: { children?: React.ReactNode }) {
  return (
    <div className="bg-[#0B3B7A] text-white mx-4 -mt-4 rounded-xl shadow
                    border-4 border-white grid place-items-center h-16 text-sm font-semibold">
      {children ?? 'Bugünkü kullanım amacınız nedir?'}
    </div>
  )
}
