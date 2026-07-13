import { Wreath } from "@/components/showcase/wreath";

export function Showcase() {
  return (
    <div className="relative mx-auto mt-12 mb-8 grid w-fit grid-cols-3 gap-8 md:my-24 md:gap-20">
      <Wreath>
        <p className="text-[0.625rem] md:text-base">Learning loop</p>
        <p className="mt-1.5 text-center text-xs font-bold md:text-2xl">
          Learn
          <br />
          Test
          <br />
          Improve
        </p>
      </Wreath>
      <Wreath>
        <p className="text-[0.625rem] md:text-base">Study workspace</p>
        <p className="mt-1.5 text-center text-xs font-bold md:text-2xl">
          Courses
          <br />+
          <br />
          Quizzes
        </p>
      </Wreath>
      <Wreath>
        <p className="text-[0.625rem] md:text-base">AI support</p>
        <p className="mt-1.5 text-center text-xs font-bold text-balance md:text-2xl">
          Hint-first
          <br />
          by design
        </p>
      </Wreath>
    </div>
  );
}
