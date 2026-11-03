import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
export default function CalendarDemo() {
  // Basic calendar state
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Range selection state
 
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Disabled dates state
  const [disabledDate, setDisabledDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Function to reset to today and ensure calendar updates
  const resetToToday = () => {
    const today = new Date();
    setDisabledDate(today);
    setCurrentMonth(today); // Also update the displayed month
  };

  // Multi-month state

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Basic Calendar 基本日历</h2>
      <div className="flex gap-4 items-start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
        />
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Selected Date 选择的日期</CardTitle>
            <CardDescription>Click on a date to select it</CardDescription>
          </CardHeader>
          <CardContent>
            {date && (
              <div className="text-2xl font-semibold">
                {format(date, "PPP")}
              </div>
            )}
            <p className="text-muted-foreground mt-2">
              {date && format(date, "EEEE, MMMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Date Range 日期范围</h2>
      <div className="flex gap-4 items-start flex-wrap">
        <div className="min-w-[300px]">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            className="rounded-md border"
          />
        </div>
        <Card className="max-w-md min-w-[300px] flex-shrink-0">
          <CardHeader>
            <CardTitle>Selected Range 选择的范围</CardTitle>
            <CardDescription>Select a start and end date</CardDescription>
          </CardHeader>
          <CardContent>
            {dateRange?.from && dateRange?.to && (
              <div>
                <div className="text-lg font-semibold">
                  From: {format(dateRange.from, "PPP")}
                </div>
                <div className="text-lg font-semibold mt-2">
                  To: {format(dateRange.to, "PPP")}
                </div>
                <p className="text-muted-foreground mt-2">
                  Total days: {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Disabled Dates 禁用日期</h2>
      <div className="flex gap-4 items-start">
        <Calendar
          required={false}
          mode="single"
          selected={disabledDate}
          onSelect={(val) => {
            if (val) setDisabledDate(val);
          }}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          disabled={(date) => date < new Date()}
          className="rounded-md border"
        />
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Disabled Past Dates 禁用过去日期</CardTitle>
            <CardDescription>Only future dates can be selected</CardDescription>
          </CardHeader>
          <CardContent>
            {disabledDate && (
              <div className="text-2xl font-semibold">
                {format(disabledDate, "PPP")}
              </div>
            )}
            <div className="mt-4">
              <Button 
                variant="secondary" 
                onClick={resetToToday}
              >
                Reset to Today
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Date Range Selection 日期范围选择</h2>
      <div className="flex gap-4 items-start flex-wrap">
        <div className="min-w-[300px]">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            defaultMonth={dateRange?.from || new Date()}
            required={false}
            key={`range-multi-calendar-${dateRange?.from?.getTime() || 'none'}-${dateRange?.to?.getTime() || 'none'}`}
            className="rounded-md border"
            numberOfMonths={2}
            captionLayout="dropdown"
          />
        </div>
        <Card className="max-w-md min-w-[300px] flex-shrink-0">
          <CardHeader>
            <CardTitle>Selected Range 选择的范围</CardTitle>
            <CardDescription>Select a date range across multiple months</CardDescription>
          </CardHeader>
          <CardContent>
            {dateRange?.from && dateRange?.to && (
              <div>
                <div className="text-lg font-semibold">
                  From: {format(dateRange.from, "PPP")}
                </div>
                <div className="text-lg font-semibold mt-2">
                  To: {format(dateRange.to, "PPP")}
                </div>
                <p className="text-muted-foreground mt-2">
                  Total days: {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1}
                </p>
              </div>
            )}
            {!dateRange?.from && !dateRange?.to && (
              <p className="text-muted-foreground">Please select a date range</p>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold">Custom Styling 自定义样式</h2>
      <div className="flex gap-4 flex-wrap">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-full border overflow-hidden"
        />
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border bg-accent/20"
        />
      </div>
    </div>
  );
}